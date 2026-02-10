/**
 * Bahasa Indonesia translations
 */
import type { TranslationKeys } from './en';

export const id: TranslationKeys = {
    // Common
    common: {
        save: "Simpan",
        cancel: "Batal",
        delete: "Hapus",
        edit: "Edit",
        add: "Tambah",
        close: "Tutup",
        loading: "Memuat...",
        error: "Error",
        success: "Berhasil",
        confirm: "Konfirmasi",
        back: "Kembali",
        next: "Lanjut",
        done: "Selesai",
        search: "Cari",
        filter: "Filter",
        apply: "Terapkan",
        reset: "Reset",
        viewAll: "Lihat Semua",
        manage: "Kelola",
    },

    // Greetings
    greetings: {
        morning: "Selamat Pagi",
        afternoon: "Selamat Siang",
        evening: "Selamat Malam",
    },

    // Navigation
    nav: {
        home: "Beranda",
        transactions: "Transaksi",
        planning: "Perencanaan",
        settings: "Pengaturan",
    },

    // Dashboard
    dashboard: {
        totalBalance: "Total Saldo",
        activePlan: "Rencana Aktif",
        remainingBudget: "Sisa Anggaran",
        used: "terpakai",
        spent: "terpakai",
        of: "dari",
        myAccounts: "Akun Saya",
        noAccounts: "Belum ada akun",
        noAccountsYet: "Belum ada akun",
        addAccount: "Tambah Akun",
        recentActivity: "Aktivitas Terbaru",
        noTransactions: "Belum ada transaksi",
        noTransactionsYet: "Belum ada transaksi",
        startTracking: "Mulai catat dengan menambahkan transaksi pertama",
        income: "Pemasukan",
        expense: "Pengeluaran",
        expenses: "Pengeluaran",
        transfer: "Transfer",
        default: "Utama",
    },

    // Transactions
    transactions: {
        title: "Transaksi",
        transaction: "Transaksi",
        newTransaction: "Transaksi Baru",
        searchPlaceholder: "Cari transaksi...",
        swipeToDelete: "Geser kiri untuk hapus",
        noResults: "Tidak ada transaksi yang cocok dengan filter.",
        deleteTitle: "Hapus Entri?",
        periodSummary: "Ringkasan Periode",
        surplus: "SURPLUS",
        deficit: "DEFISIT",
        today: "Hari Ini",
        yesterday: "Kemarin",
    },

    // Transaction Types
    transactionTypes: {
        income: "Pemasukan",
        expense: "Pengeluaran",
        transfer: "Transfer",
        all: "Semua",
    },

    // Planning
    planning: {
        title: "Perencanaan",
        budgets: "Anggaran",
        createBudget: "Buat Anggaran",
        noBudgets: "Belum ada anggaran",
        createFirst: "Buat rencana pengeluaran pertama untuk mulai menganggarkan",
        myPlans: "Rencana Saya",
        newPlan: "Rencana Baru",
        editPlan: "Edit Rencana",
        createPlan: "Buat Rencana",
        deletePlan: "Hapus Rencana?",
        deletePlanConfirm: "Apakah Anda yakin ingin menghapus rencana ini? Tindakan ini tidak dapat dibatalkan.",
        totalPlannedBudget: "Total Anggaran Terencana",
        activePlans: "Rencana Aktif",
        totalSpent: "Total Terpakai",
        spent: "terpakai",
        default: "Utama",
        planName: "Nama Rencana",
        planNamePlaceholder: "cth. Januari 2026, Trip Bali",
        frequencyDuration: "Frekuensi / Durasi",
        startDate: "Tanggal Mulai",
        endDate: "Tanggal Akhir",
        categoryAllocations: "Alokasi Kategori",
        selectCategory: "Pilih Kategori",
        allocations: "Alokasi",
        addAllocations: "Tambah Alokasi",
        totalAllocated: "Total Dialokasikan",
        overallNotes: "Catatan Keseluruhan (Opsional)",
        notesPlaceholder: "Tambahkan catatan tentang rencana ini...",
        searchCategories: "Cari kategori...",
        createCategory: "Buat",
        tapToCreate: "Ketuk untuk membuat kategori baru ini",
        noPlansYet: "Belum Ada Rencana",
        loadingPlans: "Memuat rencana...",
        total: "Total",
        errorPlanName: "Silakan masukkan nama rencana",
        errorNetwork: "Kesalahan jaringan",
        errorSave: "Gagal menyimpan",
        errorDelete: "Gagal menghapus rencana",
        loadingPlanDetails: "Memuat detail rencana...",
    },

    // Settings
    settings: {
        title: "Pengaturan",
        accountManagement: "Manajemen Akun",
        financialAccounts: "Akun Keuangan",
        financialAccountsDesc: "Kelola rekening bank, e-wallet & tunai",
        categories: "Kategori",
        categoriesDesc: "Kelola kategori pemasukan & pengeluaran",
        familyManagement: "Manajemen Keluarga",
        familyMembersDesc: "Kelola anggota dan undangan",
        preferences: "Preferensi",
        notifications: "Notifikasi",
        pushNotifications: "Notifikasi push",
        appearance: "Tampilan",
        language: "Bahasa",
        support: "Dukungan",
        helpFaq: "Bantuan & FAQ",
        privacyPolicy: "Kebijakan Privasi",
        appVersion: "Versi Aplikasi",
        signOut: "Keluar",
        signOutConfirmTitle: "Keluar",
        signOutConfirmMessage: "Apakah Anda yakin ingin keluar?",
    },

    // Theme options
    theme: {
        title: "Tampilan",
        light: "Terang",
        dark: "Gelap",
        system: "Default Sistem",
        systemDesc: "Ikuti pengaturan perangkat",
    },

    // Language options
    language: {
        title: "Bahasa",
        en: "English (US)",
        id: "Bahasa Indonesia",
    },

    // Transaction Form Modal
    transactionForm: {
        amount: "Jumlah",
        account: "Akun",
        fromAccount: "Dari Akun",
        toAccount: "Ke Akun",
        date: "Tanggal",
        planning: "Perencanaan",
        budgetPlan: "Rencana Anggaran",
        unplanned: "Tidak Terencana",
        noBudgetPlan: "Tidak Ada Rencana Anggaran",
        noBudgetPlanDesc: "Kami merekomendasikan untuk membuat rencana anggaran untuk melacak batas pengeluaran Anda.",
        category: "Kategori",
        searchCategories: "Cari kategori...",
        note: "Catatan",
        notePlaceholder: "Tambahkan catatan...",
        saveTransaction: "Simpan Transaksi",
        loadingDetails: "Memuat detail...",
        enterAmountAndAccount: "Silakan masukkan jumlah dan pilih akun",
        selectTargetAccount: "Silakan pilih akun tujuan",
        networkError: "Kesalahan jaringan",
    },

    // Edit Profile Modal
    editProfile: {
        title: "Edit Profil",
        yourName: "Nama Anda",
        namePlaceholder: "Masukkan nama Anda",
        email: "Email",
        emailCannotBeChanged: "Email tidak dapat diubah",
        saveChanges: "Simpan Perubahan",
        nameRequired: "Nama wajib diisi",
        updateFailed: "Gagal memperbarui profil",
        networkError: "Kesalahan jaringan. Silakan coba lagi.",
    },

    // Family Management Modal
    family: {
        title: "Manajemen Keluarga",
        activeFamily: "Keluarga Aktif",
        newFamily: "Keluarga Baru",
        pendingInvitations: "Undangan Tertunda",
        invitedBy: "Diundang oleh",
        members: "Anggota",
        inviteMember: "Undang Anggota",
        deleteFamily: "Hapus Keluarga",
        deleteFamilyConfirm: "Hapus Keluarga?",
        deleteFamilyMsg: "Apakah Anda yakin ingin menghapus keluarga ini? Tindakan ini tidak dapat dibatalkan jika tidak ada transaksi.",
        removeMember: "Hapus Anggota",
        removeMemberConfirm: "Hapus Anggota?",
        removeMemberMsg: "Apakah Anda yakin ingin menghapus anggota ini dari keluarga?",
        makeAdmin: "Jadikan Admin",
        revokeAdmin: "Cabut Admin",
        makeAdminConfirm: "Jadikan Admin?",
        makeAdminMsg: "Pengguna ini akan memiliki akses penuh untuk mengelola pengaturan dan anggota keluarga.",
        revokeAdminConfirm: "Cabut Admin?",
        revokeAdminMsg: "Pengguna ini tidak lagi dapat mengelola pengaturan keluarga.",
        createFamily: "Buat Keluarga",
        createNewFamily: "Buat Keluarga Baru",
        familyName: "Nama Keluarga",
        familyNamePlaceholder: "cth. Keluarga Budi",
        inviteMembers: "Undang Anggota",
        emailAddress: "Alamat Email",
        emailPlaceholder: "Masukkan email...",
        whatsapp: "WhatsApp",
        copyLink: "Salin Link",
        share: "Bagikan",
        sendInvite: "Kirim Undangan",
        pleaseWait: "Mohon tunggu...",
        linkCopied: "Link disalin ke clipboard!",
        inviteSent: "Undangan berhasil dikirim!",
        you: "Anda",
        failedCreate: "Gagal membuat keluarga",
        failedDelete: "Gagal menghapus keluarga",
        failedRemove: "Gagal menghapus anggota",
        failedUpdateRole: "Gagal memperbarui peran",
        failedInvite: "Gagal membuat undangan",
        failedRespond: "Gagal merespons undangan",
    },

    // Account Manager Modal
    accountManager: {
        title: "Manajer Akun",
        totalBalance: "Total Saldo",
        accounts: "akun",
        newAccount: "Akun Baru",
        editAccount: "Edit Akun",
        accountName: "Nama Akun",
        accountNamePlaceholder: "cth. Tabungan BCA",
        accountType: "Tipe Akun",
        initialBalance: "Saldo Awal",
        currentBalance: "Saldo Saat Ini",
        logo: "Logo (Opsional)",
        searchLogos: "Cari logo...",
        saveChanges: "Simpan Perubahan",
        createAccount: "Buat Akun",
        deleteAccount: "Hapus Akun?",
        deleteAccountMsg: "Ini akan menghapus akun. Transaksi akan disimpan tetapi tidak terhubung.",
        enterAccountName: "Silakan masukkan nama akun",
        failedSave: "Gagal menyimpan akun",
        failedDelete: "Gagal menghapus akun",
        networkError: "Kesalahan jaringan",
        pleaseWait: "Mohon tunggu...",
    },

    // Category Manager Modal
    categoryManager: {
        title: "Kategori",
        expense: "Pengeluaran",
        income: "Pemasukan",
        newCategory: "Kategori Baru",
        editCategory: "Edit Kategori",
        categoryName: "Nama Kategori",
        categoryNamePlaceholder: "cth. Belanja",
        categoryType: "Tipe Kategori",
        createCategory: "Buat Kategori",
        saveCategory: "Simpan Kategori",
        noCustomCategories: "Tidak ada kategori kustom ditemukan",
        tapPlusToAdd: "Ketuk + untuk menambah",
        deleteCategory: "Hapus Kategori",
        deleteCategoryMsg: "Apakah Anda yakin? Tindakan ini tidak dapat dibatalkan.",
        failedSave: "Gagal menyimpan kategori",
        failedDelete: "Gagal menghapus",
    },

    // Modals (legacy keys)
    modals: {
        editProfile: "Edit Profil",
        familyManagement: "Manajemen Keluarga",
        accountManagement: "Manajemen Akun",
        categoryManagement: "Manajemen Kategori",
    },

    // Account types
    accountTypes: {
        cash: "Tunai",
        bank: "Bank",
        credit: "Kredit",
        ewallet: "E-Wallet",
        investment: "Investasi",
        other: "Lainnya",
    },

    // Filter
    filter: {
        title: "Filter",
        type: "Tipe",
        account: "Akun",
        member: "Anggota",
        plan: "Rencana",
        dateRange: "Rentang Tanggal",
        startDate: "Tanggal Mulai",
        endDate: "Tanggal Akhir",
        clearFilters: "Hapus Filter",
    },

    // Validation
    validation: {
        required: "Kolom ini wajib diisi",
        invalidEmail: "Alamat email tidak valid",
        invalidAmount: "Jumlah tidak valid",
    },

    // Errors
    errors: {
        somethingWentWrong: "Terjadi kesalahan",
        networkError: "Kesalahan jaringan. Silakan coba lagi.",
        loadFailed: "Gagal memuat data",
    },

    // Help content
    help: {
        title: "Bantuan & FAQ",
        content: "Morfosis adalah aplikasi manajemen keuangan pribadi yang dirancang untuk membantu Anda melacak pengeluaran, mengelola anggaran, dan berkoordinasi dengan keluarga.\n\nFitur Utama:\n• Berbagi Grup Keluarga\n• Pelacakan transaksi\n• Perencanaan anggaran\n• Manajemen akun keuangan\n\nUntuk bantuan lebih lanjut, silakan hubungi support@morfosis.id.",
    },

    // Privacy content
    privacy: {
        title: "Kebijakan Privasi",
        content: "Kebijakan Privasi\n\nPrivasi Anda penting bagi kami. Morfosis mengumpulkan informasi pengguna dasar seperti nama dan email untuk menyediakan fitur personalisasi. Kami tidak membagikan data pribadi Anda dengan pihak ketiga tanpa persetujuan Anda. Data keuangan Anda disimpan dengan aman.\n\nTanggal Berlaku: 1 Januari 2026.",
    },
};
