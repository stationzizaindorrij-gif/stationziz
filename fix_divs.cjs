const fs = require('fs');
let code = fs.readFileSync('src/components/Billing.tsx', 'utf8');

const regex = /                      Page 1 \/ 1\n                    <\/div>\n                  <\/div>\n                <\/div>\n              <\/div>[\s\S]*?\{\/\* Partner Modal \*\/\}/;

code = code.replace(regex, `                      Page 1 / 1
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partner Modal */}`);

fs.writeFileSync('src/components/Billing.tsx', code);
