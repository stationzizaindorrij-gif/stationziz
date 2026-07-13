const fs = require('fs');
let code = fs.readFileSync('src/components/Billing.tsx', 'utf8');

const oldPdf = `  const downloadPDF = async (invoiceId?: string) => {
    if (!printRef.current) return;
    const element = printRef.current;
    
    // Si on veut imprimer une facture spécifique
    const opt = {
      margin: 10,
      filename: invoiceId ? \`Facture-\${invoiceId}.pdf\` : 'Factures.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    html2pdf().from(element).set(opt).save();
  };`;

const newPdf = `  const downloadPDF = async (invoiceId?: string) => {
    if (!printRef.current) return;
    const element = printRef.current;
    
    const screenView = element.querySelector('.print\\\\:hidden');
    const printView = element.querySelector('.hidden.print\\\\:block');
    
    if (screenView && printView) {
      screenView.classList.add('hidden');
      printView.classList.remove('hidden');
      printView.classList.remove('print:block');
      printView.classList.add('block');
    }

    const opt = {
      margin: 10,
      filename: invoiceId ? \`Facture-\${invoiceId}.pdf\` : 'Facture.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    
    html2pdf().from(element).set(opt).save().then(() => {
      if (screenView && printView) {
        screenView.classList.remove('hidden');
        printView.classList.add('hidden');
        printView.classList.add('print:block');
        printView.classList.remove('block');
      }
    });
  };`;

code = code.replace(oldPdf, newPdf);
fs.writeFileSync('src/components/Billing.tsx', code);
