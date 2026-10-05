import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Minimal YAML parser — handles the flat key-value + list structure used by our model definitions. */
function parseYaml(yamlText: string): Record<string, any> {
  const lines = yamlText.split("\n").map((l) => l.replace(/\r$/, ""));
  const root: Record<string, any> = {};
  let currentSection: Record<string, any> = root;
  let currentList: any[] | null = null;
  let listKey = "";

  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const indent = raw.length - raw.trimStart().length;
    const trimmed = raw.trim();

    if (trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();

      if (val === "") {
        // Could be a nested section or a list
        currentSection[key] = {};
        currentSection = currentSection[key] as Record<string, any>;
        currentList = null;
      } else {
        // Parse scalar value
        const num = Number(val);
        currentSection[key] = isNaN(num) ? val.replace(/^["']|["']$/g, "") : num;
      }
    } else if (trimmed.startsWith("- ")) {
      const item = trimmed.slice(2).trim();
      if (!currentList) {
        currentList = [];
        // Find the parent key — we need to attach this list to the right place
        // The last key set on currentSection before the list
      }
      // Simple: parse "key: value" within list item
      const itemObj: Record<string, any> = {};
      const parts = item.split(/,\s*/);
      for (const part of parts) {
        const [k, v] = part.split(/:\s*/);
        if (v !== undefined) {
          const num = Number(v);
          itemObj[k.trim()] = isNaN(num) ? v.replace(/^["']|["']$/g, "") : num;
        }
      }
      if (Object.keys(itemObj).length > 0) {
        currentList.push(itemObj);
      } else {
        currentList.push(item);
      }
    }
  }
  return root;
}

/** Safe expression evaluator using mathjs-style approach. Supports +, -, *, /, (), variables. */
function evalExpression(expr: string, context: Record<string, number>): number {
  let sanitized = expr;
  // Replace variable names with values
  for (const [key, val] of Object.entries(context)) {
    sanitized = sanitized.replace(new RegExp(`\\b${key}\\b`, "g"), String(val));
  }
  // Validate: only allow numbers, operators, parens, spaces
  if (!/^[\d\s+\-*/().]+$/.test(sanitized)) {
    throw new Error(`Expression contains invalid characters after substitution: ${sanitized}`);
  }
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${sanitized});`)();
  if (typeof result !== "number" || isNaN(result)) {
    throw new Error(`Expression "${expr}" returned non-numeric value: ${result}`);
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { model_id, user_id, start_time, end_time, datapoint_ids } = body;

    if (!model_id || !user_id || !start_time || !end_time) {
      return json({ error: "Missing required fields: model_id, user_id, start_time, end_time" }, 400);
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
    };

    // 1. Load model definition
    const modelRes = await fetch(
      `${supabaseUrl}/rest/v1/dvm_models?id=eq.${model_id}&select=yaml_definition,plant_config_id&limit=1`,
      { headers }
    );
    const modelRows = await modelRes.json();
    if (!modelRows[0]) return json({ error: "Model not found" }, 404);

    const definition = parseYaml(modelRows[0].yaml_definition);
    const model = definition.model || definition;

    // 2. Create a model run record (PENDING)
    const runRes = await fetch(`${supabaseUrl}/rest/v1/dvm_model_runs`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({
        model_id,
        user_id,
        start_time,
        end_time,
        state: "RUNNING",
      }),
    });
    const runRows = await runRes.json();
    const runId = runRows[0].id;

    try {
      // 3. Collect datapoints in the time range
      let dpUrl = `${supabaseUrl}/rest/v1/dvm_datapoints?select=id,numeric_value,datapoint_type_id,event_id&event_id=in.(select id from dvm_events where plant_config_id=eq.${modelRows[0].plant_config_id} and timestamp=gte.${start_time} and timestamp=lte.${end_time})`;
      if (datapoint_ids) {
        dpUrl = `${supabaseUrl}/rest/v1/dvm_datapoints?id=in.(${datapoint_ids.join(",")})&select=id,numeric_value,datapoint_type_id`;
      }
      const dpRes = await fetch(dpUrl, { headers });
      const datapoints = await dpRes.json();

      // 4. Load datapoint types to map slugs
      const dpTypeIds = [...new Set(datapoints.map((dp: any) => dp.datapoint_type_id))];
      const dpTypesRes = await fetch(
        `${supabaseUrl}/rest/v1/dvm_datapoint_types?id=in.(${dpTypeIds.join(",")})&select=id,slug`,
        { headers }
      );
      const dpTypes = await dpTypesRes.json();
      const dpTypeMap: Record<string, string> = {};
      for (const dpt of dpTypes) dpTypeMap[dpt.id] = dpt.slug;

      // 5. Build context from inputs
      const context: Record<string, number> = {};
      const inputs = model.inputs || [];
      const staticInputs = model.static_inputs || [];
      const outputs = model.outputs || [];

      for (const input of inputs) {
        const matchingDps = datapoints.filter((dp: any) => dpTypeMap[dp.datapoint_type_id] === input.datapoint_type || dpTypeMap[dp.datapoint_type_id] === input.id);
        if (matchingDps.length === 0) {
          throw new Error(`Missing input: ${input.id} (datapoint_type: ${input.datapoint_type || input.id})`);
        }
        const values = matchingDps.map((dp: any) => Number(dp.numeric_value)).filter((v: number) => !isNaN(v));
        if (values.length === 0) throw new Error(`No numeric values for input: ${input.id}`);
        context[input.id] = values.reduce((a: number, b: number) => a + b, 0) / (input.unit === "%" ? values.length : 1);
      }

      for (const input of staticInputs) {
        context[input.id] = Number(input.value);
      }

      // 6. Evaluate outputs in order
      const outputResults: Record<string, { value: number; unit: string }> = {};
      for (const output of outputs) {
        const value = evalExpression(output.expression, context);
        outputResults[output.id] = { value, unit: output.unit || "" };
        context[output.id] = value;
      }

      // 7. Update model run as COMPLETE
      await fetch(`${supabaseUrl}/rest/v1/dvm_model_runs?id=eq.${runId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          state: "COMPLETE",
          calculations: outputResults,
          outputs: outputResults,
        }),
      });

      return json({
        status: "complete",
        model_run_id: runId,
        outputs: outputResults,
        datapoints_used: datapoints.length,
      });
    } catch (runErr) {
      // Mark run as FAILED
      await fetch(`${supabaseUrl}/rest/v1/dvm_model_runs?id=eq.${runId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          state: "FAILED",
          error_message: runErr instanceof Error ? runErr.message : String(runErr),
        }),
      });
      throw runErr;
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
