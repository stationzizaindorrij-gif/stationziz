import re

with open('src/components/Assets.tsx', 'r') as f:
    content = f.read()

# I will find the part from <button type="submit" ...> Enregistrer </button> and fix it manually.
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6 p-6">
          <PriceHistory store={store} />
        </div>
      )}

    </div>
  );
}"""

if search in content:
    content = content.replace(search, replace)
    with open('src/components/Assets.tsx', 'w') as f:
        f.write(content)
    print("Fixed.")
else:
    print("Not found.")
