// src/components/dashboard/MonthlyExpenseDetail.jsx
export default function MonthlyExpenseDetail({ onClose }) {
  // Dummy week data
  const weeks = [
    { week: "Week 1", amount: 1000 },
    { week: "Week 2", amount: 900 },
    { week: "Week 3", amount: 800 },
    { week: "Week 4", amount: 900 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-xl w-full max-w-md relative shadow-xl">
        <button className="absolute top-3 right-3 text-lg" onClick={onClose}>✖</button>
        <h2 className="font-bold text-xl mb-4">This Month - Week Wise</h2>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="py-2">Week</th>
              <th className="py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => (
              <tr key={i}>
                <td className="py-2">{w.week}</td>
                <td className="py-2 font-semibold">₹{w.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
