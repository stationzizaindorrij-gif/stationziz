1. **Module setup**:
   - We have `daily_closing` active module.
   - Component `DailyClosing.tsx` handles the wizard.

2. **Wizard state**:
   - `step` (1 to 7)
   - `activeShift` (first active shift from `store.shifts`, or null if none). If null, show a message "Aucun shift actif à clôturer."
   - Simulated data for the active shift:
     - `simulatedCounters` (generated on mount for the nozzles of the shift)
     - `simulatedProducts` (list of sold products like 'Huile Moteur', 'Lave-Glace')
     - `simulatedServices` (like 'Lavage complet', 'Vidange')
     - `simulatedPayments` (breakdown of total amount)
   - `expenses` (list of expenses added in step 6)
   - `realCash` (entered in step 7)

3. **Step 1: Informations du Shift**
   - Read-only data from `activeShift`.

4. **Step 2: Carburants**
   - Table of nozzles for the shift.
   - Start index, End index, Qty, Unit Price, Total.
   - Total fuel sales.

5. **Step 3: Produits**
   - Table of products sold.
   - Product, Qty, Unit Price, Total.
   - Total product sales.

6. **Step 4: Services**
   - Table of services sold.
   - Service, Amount.
   - Total services sales.

7. **Step 5: Paiements**
   - Breakdown of the grand total (Fuel + Products + Services) into Cash, CB, Chèque, etc.

8. **Step 6: Dépenses**
   - Form to add an expense (Type, Description, Amount, Payment Method).
   - Table of expenses.

9. **Step 7: Résumé & Validation**
   - Summary of totals.
   - Theoretical Cash = Cash payments - Cash expenses.
   - Input for Real Cash.
   - Ecart calculation.
   - Button "Clôturer la journée".
