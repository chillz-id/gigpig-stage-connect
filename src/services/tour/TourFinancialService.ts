// Tour Financial Service - Expenses, revenue, and financial operations
import { supabase } from '@/integrations/supabase/client';
import type {
  TourExpense,
  TourRevenue,
  CreateTourExpenseRequest,
  CreateTourRevenueRequest
} from '@/types/tour';

class TourFinancialService {
  // =====================================
  // TOUR EXPENSE MANAGEMENT
  // =====================================

  async createTourExpense(data: CreateTourExpenseRequest): Promise<TourExpense> {
    const { data: expense, error } = await supabase
      .from('tour_expenses')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return expense;
  }

  async updateTourExpense(id: string, data: Partial<CreateTourExpenseRequest>): Promise<TourExpense> {
    const { data: expense, error } = await supabase
      .from('tour_expenses')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return expense;
  }

  async getTourExpenses(tourId: string, stopId?: string): Promise<TourExpense[]> {
    let query = supabase
      .from('tour_expenses')
      .select('*')
      .eq('tour_id', tourId);

    if (stopId) {
      query = query.eq('stop_id', stopId);
    }

    const { data, error } = await query.order('expense_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async deleteTourExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // TOUR REVENUE MANAGEMENT
  // =====================================

  async createTourRevenue(data: CreateTourRevenueRequest): Promise<TourRevenue> {
    const { data: revenue, error } = await supabase
      .from('tour_revenue')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return revenue;
  }

  async updateTourRevenue(id: string, data: Partial<CreateTourRevenueRequest>): Promise<TourRevenue> {
    const { data: revenue, error } = await supabase
      .from('tour_revenue')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return revenue;
  }

  async getTourRevenue(tourId: string, stopId?: string): Promise<TourRevenue[]> {
    let query = supabase
      .from('tour_revenue')
      .select('*')
      .eq('tour_id', tourId);

    if (stopId) {
      query = query.eq('stop_id', stopId);
    }

    const { data, error } = await query.order('revenue_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async deleteTourRevenue(id: string): Promise<void> {
    const { error } = await supabase
      .from('tour_revenue')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // =====================================
  // FINANCIAL ANALYTICS AND REPORTING
  // =====================================

  async getTourFinancialSummary(tourId: string): Promise<{
    totalExpenses: number;
    totalRevenue: number;
    netProfit: number;
    expensesByCategory: Record<string, number>;
    revenueBySource: Record<string, number>;
  }> {
    // Get all expenses for the tour
    const expenses = await this.getTourExpenses(tourId);
    const revenue = await this.getTourRevenue(tourId);

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalRevenue = revenue.reduce((sum, rev) => sum + (rev.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + (expense.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    // Group revenue by source
    const revenueBySource = revenue.reduce((acc, rev) => {
      const source = rev.source || 'Other';
      acc[source] = (acc[source] || 0) + (rev.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses,
      totalRevenue,
      netProfit,
      expensesByCategory,
      revenueBySource
    };
  }

  async getTourProfitability(tourId: string): Promise<{
    profitMargin: number;
    roi: number;
    breakEvenPoint: number;
  }> {
    const summary = await this.getTourFinancialSummary(tourId);
    
    const profitMargin = summary.totalRevenue > 0 
      ? (summary.netProfit / summary.totalRevenue) * 100 
      : 0;
    
    const roi = summary.totalExpenses > 0 
      ? (summary.netProfit / summary.totalExpenses) * 100 
      : 0;
    
    // Simple break-even calculation (expenses needed to cover)
    const breakEvenPoint = summary.totalExpenses;

    return {
      profitMargin,
      roi,
      breakEvenPoint
    };
  }

  async getExpensesByDateRange(
    tourId: string, 
    startDate: string, 
    endDate: string
  ): Promise<TourExpense[]> {
    const { data, error } = await supabase
      .from('tour_expenses')
      .select('*')
      .eq('tour_id', tourId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getRevenueByDateRange(
    tourId: string, 
    startDate: string, 
    endDate: string
  ): Promise<TourRevenue[]> {
    const { data, error } = await supabase
      .from('tour_revenue')
      .select('*')
      .eq('tour_id', tourId)
      .gte('revenue_date', startDate)
      .lte('revenue_date', endDate)
      .order('revenue_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // =====================================
  // BULK FINANCIAL OPERATIONS
  // =====================================

  async bulkCreateExpenses(tourId: string, expenses: Omit<CreateTourExpenseRequest, 'tour_id'>[]): Promise<TourExpense[]> {
    const expensesWithTourId = expenses.map(expense => ({ ...expense, tour_id: tourId }));
    
    const { data, error } = await supabase
      .from('tour_expenses')
      .insert(expensesWithTourId)
      .select();

    if (error) throw error;
    return data || [];
  }

  async bulkCreateRevenue(tourId: string, revenues: Omit<CreateTourRevenueRequest, 'tour_id'>[]): Promise<TourRevenue[]> {
    const revenueWithTourId = revenues.map(revenue => ({ ...revenue, tour_id: tourId }));
    
    const { data, error } = await supabase
      .from('tour_revenue')
      .insert(revenueWithTourId)
      .select();

    if (error) throw error;
    return data || [];
  }

  // =====================================
  // BUDGET MANAGEMENT
  // =====================================

  async createBudgetAlert(tourId: string, category: string, threshold: number): Promise<void> {
    const expenses = await this.getTourExpenses(tourId);
    const categoryExpenses = expenses
      .filter(expense => expense.category === category)
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    if (categoryExpenses >= threshold) {
      // In a real application, this would send a notification
      console.warn(`Budget alert: ${category} expenses (${categoryExpenses}) have reached threshold (${threshold})`);
    }
  }

  async getBudgetStatus(tourId: string, budgets: Record<string, number>): Promise<Record<string, {
    budgeted: number;
    spent: number;
    remaining: number;
    percentUsed: number;
  }>> {
    const expenses = await this.getTourExpenses(tourId);
    const status: Record<string, any> = {};

    for (const [category, budgetAmount] of Object.entries(budgets)) {
      const spent = expenses
        .filter(expense => expense.category === category)
        .reduce((sum, expense) => sum + (expense.amount || 0), 0);

      status[category] = {
        budgeted: budgetAmount,
        spent,
        remaining: budgetAmount - spent,
        percentUsed: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      };
    }

    return status;
  }
}

export const tourFinancialService = new TourFinancialService();
export default TourFinancialService;