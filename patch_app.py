import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

search = """        const objectKeys = ['cash_registry', 'config'];
        await runInChunks(objectKeys, async (k) => {
          const { data } = await supabase.from(`erp_${k}`).select('*').eq('user_id', session.user.id).single();
          if (data) fetchedData[k] = data;
        }, 2);"""

replace = """        const objectKeys = ['cash_registry', 'config'];
        await runInChunks(objectKeys, async (k) => {
          const { data } = await supabase.from(`erp_${k}`).select('*').eq('user_id', session.user.id).limit(1);
          if (data && data.length > 0) fetchedData[k] = data[0];
        }, 2);"""

if search in content:
    content = content.replace(search, replace)
    with open('src/App.tsx', 'w') as f:
        f.write(content)
    print("App patched")
else:
    print("search not found in App")
