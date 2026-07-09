import re

with open('src/store.ts', 'r') as f:
    content = f.read()

def replace_between(start, end, replacement, text):
    pattern = re.compile(re.escape(start) + r'.*?' + re.escape(end), re.DOTALL)
    return pattern.sub(start + replacement + end, text)

start = "    } else {\n      const { data: { session } } = await supabase.auth.getSession();\n      if (session) {\n"
end = "      }\n    }\n  };\n"

new_code = """        // Fetch existing to get its real ID if any
        const { data: existingData } = await supabase.from(`erp_${key}`).select('id').eq('user_id', session.user.id).limit(1);
        
        const payload = { ...newValue, user_id: session.user.id };
        if (existingData && existingData.length > 0) {
           payload.id = existingData[0].id;
           const { error } = await supabase.from(`erp_${key}`).update(payload).eq('id', payload.id);
           if (error) console.error(`Erreur d'update ${key}:`, error);
        } else {
           if (!payload.id || payload.id === 'default') {
              payload.id = `${key}_${session.user.id}_${Date.now()}`;
           }
           const { error: insertErr } = await supabase.from(`erp_${key}`).insert(payload);
           if (insertErr) console.error(`Erreur d'insertion ${key}:`, insertErr);
        }
"""

content = replace_between(start, end, new_code, content)

with open('src/store.ts', 'w') as f:
    f.write(content)

print("Store patched for singletons with unique ID")
