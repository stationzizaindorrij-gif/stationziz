import re

with open('src/components/ShiftWizard.tsx', 'r') as f:
    content = f.read()

# Replacement 1: State Initializers
search_state = """export default function ShiftWizard({ store, onBack, editingShift }: ShiftWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);"""

replace_state = """export default function ShiftWizard({ store, onBack, editingShift }: ShiftWizardProps) {
  const draftStr = !editingShift ? localStorage.getItem('erp_shift_draft') : null;
  const draft = draftStr ? JSON.parse(draftStr) : null;

  const [currentStep, setCurrentStep] = useState(draft?.currentStep || 1);"""
content = content.replace(search_state, replace_state)

content = content.replace("useState(editingShift?.date || new Date().toISOString().split('T')[0]);", "useState(editingShift?.date || draft?.date || new Date().toISOString().split('T')[0]);")
content = content.replace("useState(editingShift?.endDate || editingShift?.date || new Date().toISOString().split('T')[0]);", "useState(editingShift?.endDate || draft?.endDate || editingShift?.date || draft?.date || new Date().toISOString().split('T')[0]);")
content = content.replace("useState(editingShift?.attendantId || '');", "useState(editingShift?.attendantId || draft?.attendantId || '');")
content = content.replace("useState<'Journée' | 'Matin' | 'Après-midi' | 'Nuit'>(editingShift?.shiftName || 'Journée');", "useState<'Journée' | 'Matin' | 'Après-midi' | 'Nuit'>(editingShift?.shiftName || draft?.shiftName || 'Journée');")
content = content.replace("useState(editingShift?.startTime || '06:00');", "useState(editingShift?.startTime || draft?.startTime || '06:00');")
content = content.replace("useState(editingShift?.endTime || '14:00');", "useState(editingShift?.endTime || draft?.endTime || '14:00');")
content = content.replace("useState<string[]>(editingShift?.pumpIds || []);", "useState<string[]>(editingShift?.pumpIds || draft?.selectedPumps || []);")

content = content.replace("useState<{ [nozzleId: string]: { mech: number; elec: number } }>(editingShift?.startCounters || {});", "useState<{ [nozzleId: string]: { mech: number; elec: number } }>(editingShift?.startCounters || draft?.startCounters || {});")
content = content.replace("useState<{ [nozzleId: string]: { mech: number | ''; elec: number | '' } }>(editingShift?.endCounters || {});", "useState<{ [nozzleId: string]: { mech: number | ''; elec: number | '' } }>(editingShift?.endCounters || draft?.endCounters || {});")

content = content.replace("useState<any[]>(editingShift?.productsSold || []);", "useState<any[]>(editingShift?.productsSold || draft?.productSales || []);")
content = content.replace("useState<any[]>(editingShift?.servicesSold || []);", "useState<any[]>(editingShift?.servicesSold || draft?.serviceSales || []);")
content = content.replace("useState<any[]>(editingShift?.expenses || []);", "useState<any[]>(editingShift?.expenses || draft?.expenses || []);")

search_non_cash = """  const [nonCashPayments, setNonCashPayments] = useState<any>({
    carteSntl: editingShift?.nonCashPayments?.carteSntl || [],
    espece: editingShift?.nonCashPayments?.espece || [],
    bonCarburantsVivo: editingShift?.nonCashPayments?.bonCarburantsVivo || [],
    vignette: editingShift?.nonCashPayments?.vignette || [],
    bonClient: editingShift?.nonCashPayments?.bonClient || []
  });"""

replace_non_cash = """  const [nonCashPayments, setNonCashPayments] = useState<any>(draft?.nonCashPayments || {
    carteSntl: editingShift?.nonCashPayments?.carteSntl || [],
    espece: editingShift?.nonCashPayments?.espece || [],
    bonCarburantsVivo: editingShift?.nonCashPayments?.bonCarburantsVivo || [],
    vignette: editingShift?.nonCashPayments?.vignette || [],
    bonClient: editingShift?.nonCashPayments?.bonClient || []
  });"""
content = content.replace(search_non_cash, replace_non_cash)

content = content.replace("useState(editingShift?.realCashReceived?.toString() || '');", "useState(editingShift?.realCashReceived?.toString() || draft?.realCashInput || '');")


search_effect = """useEffect(() => {
    setStartCounters(prevStart => {"""

replace_effect = """useEffect(() => {
    if (!editingShift && !isCompleted) {
        localStorage.setItem('erp_shift_draft', JSON.stringify({
           currentStep, date, endDate, attendantId, shiftName, startTime, endTime,
           selectedPumps, startCounters, endCounters, productSales, serviceSales, expenses, nonCashPayments, realCashInput
        }));
    }
  }, [currentStep, date, endDate, attendantId, shiftName, startTime, endTime, selectedPumps, startCounters, endCounters, productSales, serviceSales, expenses, nonCashPayments, realCashInput, editingShift, isCompleted]);

useEffect(() => {
    setStartCounters(prevStart => {"""
content = content.replace(search_effect, replace_effect)


search_save = """    if (editingShift) {
      store.updateShift(editingShift.id, shiftData, store.currentRole);
    } else {
      store.addCompletedShift(shiftData, store.currentRole);
    }

    setIsCompleted(true);"""

replace_save = """    if (editingShift) {
      store.updateShift(editingShift.id, shiftData, store.currentRole);
    } else {
      store.addCompletedShift(shiftData, store.currentRole);
    }
    
    localStorage.removeItem('erp_shift_draft');
    setIsCompleted(true);"""
content = content.replace(search_save, replace_save)


with open('src/components/ShiftWizard.tsx', 'w') as f:
    f.write(content)

print("ShiftWizard patched")
