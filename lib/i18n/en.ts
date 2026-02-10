/**
 * English (US) translations
 */
export const en = {
    // Common
    common: {
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        edit: "Edit",
        add: "Add",
        close: "Close",
        loading: "Loading...",
        error: "Error",
        success: "Success",
        confirm: "Confirm",
        back: "Back",
        next: "Next",
        done: "Done",
        search: "Search",
        filter: "Filter",
        apply: "Apply",
        reset: "Reset",
        viewAll: "View All",
        manage: "Manage",
    },

    // Greetings
    greetings: {
        morning: "Good Morning",
        afternoon: "Good Afternoon",
        evening: "Good Evening",
    },

    // Navigation
    nav: {
        home: "Home",
        transactions: "Transactions",
        planning: "Planning",
        settings: "Settings",
    },

    // Dashboard
    dashboard: {
        totalBalance: "Total Balance",
        activePlan: "Active Plan",
        remainingBudget: "Remaining Budget",
        used: "used",
        spent: "spent",
        of: "of",
        myAccounts: "My Accounts",
        noAccounts: "No accounts yet",
        noAccountsYet: "No accounts yet",
        addAccount: "Add Account",
        recentActivity: "Recent Activity",
        noTransactions: "No transactions yet",
        noTransactionsYet: "No transactions yet",
        startTracking: "Start tracking by adding your first transaction",
        income: "Income",
        expense: "Expense",
        expenses: "Expenses",
        transfer: "Transfer",
        default: "Default",
    },

    // Transactions
    transactions: {
        title: "Transactions",
        transaction: "Transaction",
        newTransaction: "New Transaction",
        searchPlaceholder: "Search transactions...",
        swipeToDelete: "Swipe left to delete",
        noResults: "No transactions found matching your filters.",
        deleteTitle: "Delete Entry?",
        periodSummary: "Period Summary",
        surplus: "SURPLUS",
        deficit: "DEFICIT",
        today: "Today",
        yesterday: "Yesterday",
    },

    // Transaction Types
    transactionTypes: {
        income: "Income",
        expense: "Expense",
        transfer: "Transfer",
        all: "All",
    },

    // Planning
    planning: {
        title: "Planning",
        budgets: "Budgets",
        createBudget: "Create Budget",
        noBudgets: "No budgets yet",
        createFirst: "Create your first budget to start planning",
    },

    // Settings
    settings: {
        title: "Settings",
        accountManagement: "Account Management",
        financialAccounts: "Financial Accounts",
        financialAccountsDesc: "Manage bank accounts, e-wallets & cash",
        categories: "Categories",
        categoriesDesc: "Manage income & expense categories",
        familyManagement: "Family Management",
        familyMembersDesc: "Manage members and invitations",
        preferences: "Preferences",
        notifications: "Notifications",
        pushNotifications: "Push notifications",
        appearance: "Appearance",
        language: "Language",
        support: "Support",
        helpFaq: "Help & FAQ",
        privacyPolicy: "Privacy Policy",
        appVersion: "App Version",
        signOut: "Sign Out",
        signOutConfirmTitle: "Sign Out",
        signOutConfirmMessage: "Are you sure you want to sign out?",
    },

    // Theme options
    theme: {
        title: "Appearance",
        light: "Light",
        dark: "Dark",
        system: "System Default",
        systemDesc: "Use device settings",
    },

    // Language options
    language: {
        title: "Language",
        en: "English (US)",
        id: "Bahasa Indonesia",
    },

    // Modals
    modals: {
        editProfile: "Edit Profile",
        familyManagement: "Family Management",
        accountManagement: "Account Management",
        categoryManagement: "Category Management",
    },

    // Account types
    accountTypes: {
        cash: "Cash",
        bank: "Bank",
        credit: "Credit",
        ewallet: "E-Wallet",
        investment: "Investment",
        other: "Other",
    },

    // Filter
    filter: {
        title: "Filter",
        type: "Type",
        account: "Account",
        member: "Member",
        plan: "Plan",
        dateRange: "Date Range",
        startDate: "Start Date",
        endDate: "End Date",
        clearFilters: "Clear Filters",
    },

    // Validation
    validation: {
        required: "This field is required",
        invalidEmail: "Invalid email address",
        invalidAmount: "Invalid amount",
    },

    // Errors
    errors: {
        somethingWentWrong: "Something went wrong",
        networkError: "Network error. Please try again.",
        loadFailed: "Failed to load data",
    },

    // Help content
    help: {
        title: "Help & FAQ",
        content: "Morfosis is a personal finance management app designed to help you track expenses, manage budgets, and coordinate with your family.\n\nKey Features:\n• Family Group sharing\n• Transaction tracking\n• Budget planning\n• Financial account management\n\nFor further assistance, please contact support@morfosis.id.",
    },

    // Privacy content
    privacy: {
        title: "Privacy Policy",
        content: "Privacy Policy\n\nYour privacy is important to us. Morfosis collects basic user information such as name and email to provide personalization features. We do not share your personal data with third parties without your consent. Your financial data is stored securely.\n\nEffective Date: Jan 1, 2026.",
    },
};

export type TranslationKeys = typeof en;
