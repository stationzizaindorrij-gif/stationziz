with open('src/components/Assets.tsx', 'r') as f:
    content = f.read()

idx = content.rfind('</form>')
content = content[:idx] + """</form>
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

with open('src/components/Assets.tsx', 'w') as f:
    f.write(content)
