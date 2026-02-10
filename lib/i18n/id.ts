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
        createFirst: "Buat anggaran pertama untuk mulai merencanakan",
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

    // Modals
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
