import { useState } from "react";
import Layout from "../components/Layout";
import { Target, CheckCircle2, Circle, Plus, Trash2, Calendar, Sparkles } from "lucide-react";

function PersonalPlanning() {
    const [goals, setGoals] = useState(() => {
        const saved = localStorage.getItem("vyaparsetu_personal_goals");
        return saved ? JSON.parse(saved) : [
            { id: 1, text: "Achieve ₹1,00,000 monthly sales milestone", category: "Business", completed: false, date: "2026-12-31" },
            { id: 2, text: "Review inventory stock twice every week", category: "Operations", completed: true, date: "2026-08-15" },
            { id: 3, text: "Clear all pending supplier udhaar balances", category: "Finance", completed: false, date: "2026-09-30" }
        ];
    });

    const [newGoalText, setNewGoalText] = useState("");
    const [newCategory, setNewCategory] = useState("Business");
    const [newDate, setNewDate] = useState("");

    const saveGoals = (updated) => {
        setGoals(updated);
        localStorage.setItem("vyaparsetu_personal_goals", JSON.stringify(updated));
    };

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!newGoalText.trim()) return;
        const newGoal = {
            id: Date.now(),
            text: newGoalText.trim(),
            category: newCategory,
            completed: false,
            date: newDate || new Date().toISOString().split('T')[0]
        };
        saveGoals([newGoal, ...goals]);
        setNewGoalText("");
        setNewDate("");
    };

    const toggleGoal = (id) => {
        const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
        saveGoals(updated);
    };

    const deleteGoal = (id) => {
        const updated = goals.filter(g => g.id !== id);
        saveGoals(updated);
    };

    const completedCount = goals.filter(g => g.completed).length;

    return (
        <Layout>
            <div className="max-w-3xl mx-auto space-y-7 font-sans pb-8">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100/80 border border-emerald-200 text-[#1F4D3D] flex items-center justify-center shadow-xs">
                            <Target size={20} className="stroke-[2.2]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Personal Planning & Goals</h1>
                            <p className="text-xs text-slate-500 font-normal">Track your merchant targets, reminders, and long-term business roadmap.</p>
                        </div>
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full text-emerald-800 text-xs font-extrabold">
                        <Sparkles size={14} />
                        <span>{completedCount} / {goals.length} Completed</span>
                    </div>
                </div>

                {/* Add Goal Form */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs">
                    <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-4">Add New Target Goal</h2>
                    <form onSubmit={handleAddGoal} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                required
                                value={newGoalText}
                                onChange={(e) => setNewGoalText(e.target.value)}
                                placeholder="E.g., Increase weekly repeat customer orders by 15%..."
                                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 transition"
                                >
                                    <option value="Business">Business Growth</option>
                                    <option value="Finance">Finance & Udhaar</option>
                                    <option value="Operations">Store Operations</option>
                                    <option value="Personal">Personal Milestone</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Date</label>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 transition"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full h-11 bg-gradient-to-b from-[#10b981] to-[#047857] hover:from-[#059669] hover:to-[#064e3b] text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition"
                        >
                            <Plus size={16} strokeWidth={2.5} />
                            Add Milestone Goal
                        </button>
                    </form>
                </div>

                {/* Goals Checklist */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">
                    <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Your Active Targets</h2>

                    {goals.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-8 font-medium">No target goals set yet. Add your first goal above!</p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {goals.map((g) => (
                                <div key={g.id} className="py-3.5 flex items-center justify-between gap-3 group">
                                    <div className="flex items-start gap-3">
                                        <button
                                            onClick={() => toggleGoal(g.id)}
                                            className="mt-0.5 text-slate-400 hover:text-emerald-600 cursor-pointer transition"
                                        >
                                            {g.completed ? (
                                                <CheckCircle2 size={20} className="text-emerald-600 fill-emerald-100" />
                                            ) : (
                                                <Circle size={20} />
                                            )}
                                        </button>

                                        <div>
                                            <p className={`text-xs font-bold transition ${g.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                                                {g.text}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-extrabold uppercase">
                                                    {g.category}
                                                </span>
                                                {g.date && (
                                                    <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1">
                                                        <Calendar size={10} /> {g.date}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => deleteGoal(g.id)}
                                        className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
}

export default PersonalPlanning;
