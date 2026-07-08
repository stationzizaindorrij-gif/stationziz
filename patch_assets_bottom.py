with open('src/components/Assets.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
history_lines = []
collecting_history = False

for line in lines:
    if line.strip() == "{activeTab === 'history' && (":
        collecting_history = True
    
    if collecting_history:
        history_lines.append(line)
    else:
        new_lines.append(line)

# Remove the last 3 lines from new_lines (which are `    </div>`, `  );`, `}`)
last_three = new_lines[-3:]
new_lines = new_lines[:-3]

# insert history lines
new_lines.extend(history_lines)

# re-add the last 3 lines
new_lines.extend(last_three)

with open('src/components/Assets.tsx', 'w') as f:
    f.writelines(new_lines)
