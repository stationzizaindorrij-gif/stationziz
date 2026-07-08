import re

with open('src/components/Assets.tsx', 'r') as f:
    content = f.read()

content = re.sub(
r"""            </form>
          </div>
      \{activeTab === 'history' && \(
        <div className="rounded-xl overflow-hidden mt-4">
          <PriceHistory store=\{store\} />
        </div>
      \)\}
    </div>
  \);
\}
        </div>
      \)\}""",
r"""            </form>
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
}""", content)

with open('src/components/Assets.tsx', 'w') as f:
    f.write(content)
