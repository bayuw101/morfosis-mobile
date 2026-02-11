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
        created: "Created successfully",
        updated: "Updated successfully",
        deleted: "Deleted successfully",
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
        createFirst: "Create your first spending plan to start budgeting",
        myPlans: "My Plans",
        newPlan: "New Plan",
        editPlan: "Edit Plan",
        createPlan: "Create Plan",
        deletePlan: "Delete Plan?",
        deletePlanConfirm: "Are you sure you want to delete this plan? This action cannot be undone.",
        totalPlannedBudget: "Total Planned Budget",
        activePlans: "Active Plans",
        totalSpent: "Total Spent",
        spent: "spent",
        default: "Default",
        planName: "Plan Name",
        planNamePlaceholder: "e.g. January 2026, Bali Trip",
        frequencyDuration: "Frequency / Duration",
        startDate: "Start Date",
        endDate: "End Date",
        categoryAllocations: "Category Allocations",
        selectCategory: "Select Category",
        allocations: "Allocations",
        addAllocations: "Add Allocations",
        totalAllocated: "Total Allocated",
        overallNotes: "Overall Notes (Optional)",
        notesPlaceholder: "Add notes about this plan...",
        searchCategories: "Search categories...",
        createCategory: "Create",
        tapToCreate: "Tap to create this new category",
        noPlansYet: "No Plans Yet",
        loadingPlans: "Loading plans...",
        total: "Total",
        errorPlanName: "Please enter a plan name",
        errorNetwork: "Network error",
        errorSave: "Failed to save",
        errorDelete: "Failed to delete plan",
        loadingPlanDetails: "Loading plan details...",
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

    // Transaction Form Modal
    transactionForm: {
        amount: "Amount",
        account: "Account",
        fromAccount: "From Account",
        toAccount: "To Account",
        date: "Date",
        planning: "Planning",
        budgetPlan: "Budget Plan",
        unplanned: "Unplanned",
        noBudgetPlan: "No Budget Plan",
        noBudgetPlanDesc: "We recommend creating a budget plan to track your spending limits.",
        category: "Category",
        searchCategories: "Search categories...",
        note: "Note",
        notePlaceholder: "Add a note...",
        saveTransaction: "Save Transaction",
        loadingDetails: "Loading details...",
        enterAmountAndAccount: "Please enter amount and select account",
        selectTargetAccount: "Please select target account",
        networkError: "Network error",
    },

    // Edit Profile Modal
    editProfile: {
        title: "Edit Profile",
        yourName: "Your Name",
        namePlaceholder: "Enter your name",
        email: "Email",
        emailCannotBeChanged: "Email cannot be changed",
        saveChanges: "Save Changes",
        nameRequired: "Name is required",
        updateFailed: "Failed to update profile",
        networkError: "Network error. Please try again.",
    },

    // Family Management Modal
    family: {
        title: "Family Management",
        activeFamily: "Active Family",
        newFamily: "New Family",
        pendingInvitations: "Pending Invitations",
        invitedBy: "Invited by",
        members: "Members",
        inviteMember: "Invite Member",
        deleteFamily: "Delete Family",
        deleteFamilyConfirm: "Delete Family?",
        deleteFamilyMsg: "Are you sure you want to delete this family? This action cannot be undone if no transactions exist.",
        removeMember: "Remove Member",
        removeMemberConfirm: "Remove Member?",
        removeMemberMsg: "Are you sure you want to remove this member from the family?",
        makeAdmin: "Make Admin",
        revokeAdmin: "Revoke Admin",
        makeAdminConfirm: "Make Admin?",
        makeAdminMsg: "This user will have full access to manage family settings and members.",
        revokeAdminConfirm: "Revoke Admin?",
        revokeAdminMsg: "This user will no longer be able to manage family settings.",
        createFamily: "Create Family",
        createNewFamily: "Create New Family",
        familyName: "Family Name",
        familyNamePlaceholder: "e.g. The Smiths",
        inviteMembers: "Invite Members",
        emailAddress: "Email Address",
        emailPlaceholder: "Enter email...",
        whatsapp: "WhatsApp",
        copyLink: "Copy Link",
        share: "Share",
        sendInvite: "Send Invite",
        pleaseWait: "Please wait...",
        linkCopied: "Link copied to clipboard!",
        inviteSent: "Invitation sent successfully!",
        you: "You",
        failedCreate: "Failed to create family",
        failedDelete: "Failed to delete family",
        failedRemove: "Failed to remove member",
        failedUpdateRole: "Failed to update role",
        failedInvite: "Failed to create invitation",
        failedRespond: "Failed to respond to invitation",
    },

    // Account Manager Modal
    accountManager: {
        title: "Account Manager",
        totalBalance: "Total Balance",
        accounts: "accounts",
        newAccount: "New Account",
        editAccount: "Edit Account",
        accountName: "Account Name",
        accountNamePlaceholder: "e.g. BCA Savings",
        accountType: "Account Type",
        initialBalance: "Initial Balance",
        currentBalance: "Current Balance",
        logo: "Logo (Optional)",
        searchLogos: "Search logos...",
        saveChanges: "Save Changes",
        createAccount: "Create Account",
        deleteAccount: "Delete Account?",
        deleteAccountMsg: "This will delete the account. Transactions will be preserved but unlinked.",
        enterAccountName: "Please enter an account name",
        failedSave: "Failed to save account",
        failedDelete: "Failed to delete account",
        networkError: "Network error",
        pleaseWait: "Please wait...",
    },

    // Category Manager Modal
    categoryManager: {
        title: "Categories",
        expense: "Expense",
        income: "Income",
        newCategory: "New Category",
        editCategory: "Edit Category",
        categoryName: "Category Name",
        categoryNamePlaceholder: "e.g. Groceries",
        categoryType: "Category Type",
        createCategory: "Create Category",
        saveCategory: "Save Category",
        noCustomCategories: "No custom categories found",
        tapPlusToAdd: "Tap + to add one",
        deleteCategory: "Delete Category",
        deleteCategoryMsg: "Are you sure? This action cannot be undone.",
        failedSave: "Failed to save category",
        failedDelete: "Failed to delete",
    },

    // Modals (legacy keys)
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
