// src/components/dashboard/YearlyExpenseDetail.jsx
export default function YearlyExpenseDetail({ onClose }) {
  // Dummy data for each month (replace with API call later)
  const months = [
    { month: "January", amount: 4800 },
    { month: "February", amount: 3600 },
    { month: "March", amount: 2750 },
    { month: "April", amount: 5200 },
    { month: "May", amount: 6100 },
    { month: "June", amount: 3900 },
    { month: "July", amount: 4700 },
    { month: "August", amount: 4500 },
    { month: "September", amount: 4800 },
    { month: "October", amount: 3500 },
    { month: "November", amount: 3700 },
    { month: "December", amount: 3300 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-xl w-full max-w-md relative shadow-xl">
        <button className="absolute top-3 right-3 text-lg" onClick={onClose}>✖</button>
        <h2 className="font-bold text-xl mb-4">This Year - Month Wise</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="py-2">Month</th>
              <th className="py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={i}>
                <td className="py-2">{m.month}</td>
                <td className="py-2 font-semibold">₹{m.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
