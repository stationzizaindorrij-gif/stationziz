with open('src/components/Assets.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(reversed(lines)):
    if 'Enregistrer' in line:
        break

# This is too error prone. I'll search for the exact lines
content = "".join(lines)
idx = content.rfind('<button \n                  type="submit"')
if idx == -1:
    idx = content.rfind('<button \n                   type="submit"')
if idx == -1:
    idx = content.rfind('Enregistrer')

# Let's just use simple python string replacement based on what I see in tail
search = """                <button 
                   type="submit" 
                   className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
      {activeTab === 'history' && (
        <div className="rounded-xl overflow-hidden mt-4">
          <PriceHistory store={store} />
        </div>
      )}
    </div>
  );
}
        </div>
      )}"""

replace = """                <button 
                   type="submit" 
                   className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
          <PriceHistory store={store} />
        </div>
      )}

    </div>
  );
}"""

content = content.replace(search, replace)

with open('src/components/Assets.tsx', 'w') as f:
    f.write(content)
