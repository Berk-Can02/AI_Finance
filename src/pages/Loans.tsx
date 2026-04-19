import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    HandCoins,
    Wallet,
    CheckCircle2,
    Pencil,
    Trash2,
    RotateCcw,
    Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoanFormDialog } from "@/components/loans/loanFormDialog";
import { useLoans, type Loan } from "@/context/LoansContext";
import { usePreferences } from "@/context/PreferencesContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "lent" | "borrowed" | "settled";

export default function Loans() {
    const { t } = useTranslation();
    const { formatAmount } = usePreferences();
    const { loans, deleteLoan, toggleSettled } = useLoans();
    const { toast } = useToast();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<FilterTab>("all");

    const summary = useMemo(() => {
        const open = loans.filter((l) => l.status === "open");
        const totalLent = open.filter((l) => l.type === "lent").reduce((s, l) => s + l.amount, 0);
        const totalBorrowed = open
            .filter((l) => l.type === "borrowed")
            .reduce((s, l) => s + l.amount, 0);
        return { totalLent, totalBorrowed, net: totalLent - totalBorrowed };
    }, [loans]);

    const filtered = useMemo(() => {
        let result = [...loans];
        if (tab === "lent") result = result.filter((l) => l.type === "lent" && l.status === "open");
        else if (tab === "borrowed")
            result = result.filter((l) => l.type === "borrowed" && l.status === "open");
        else if (tab === "settled") result = result.filter((l) => l.status === "settled");

        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (l) => l.person.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q)
            );
        }
        return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [loans, tab, search]);

    const openAdd = () => {
        setEditingLoan(null);
        setDialogOpen(true);
    };
    const openEdit = (loan: Loan) => {
        setEditingLoan(loan);
        setDialogOpen(true);
    };
    const handleDelete = () => {
        if (deleteId) {
            deleteLoan(deleteId);
            toast({ title: t("loansPage.toasts.deleted"), variant: "destructive" });
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{t("loansPage.title")}</h1>
                    <p className="text-muted-foreground mt-1">{t("loansPage.subtitle")}</p>
                </div>
                <Button onClick={openAdd} className="gradient-primary hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("loansPage.addLoan")}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("loansPage.totalLent")}</p>
                                <p className="text-2xl font-bold text-primary mt-1">
                                    {formatAmount(summary.totalLent)}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                <ArrowUpRight className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-destructive">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("loansPage.totalBorrowed")}</p>
                                <p className="text-2xl font-bold text-destructive mt-1">
                                    {formatAmount(summary.totalBorrowed)}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center">
                                <ArrowDownLeft className="w-5 h-5 text-destructive" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        "border-l-4",
                        summary.net >= 0 ? "border-l-primary" : "border-l-destructive"
                    )}
                >
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t("loansPage.netBalance")}</p>
                                <p
                                    className={cn(
                                        "text-2xl font-bold mt-1",
                                        summary.net >= 0 ? "text-primary" : "text-destructive"
                                    )}
                                >
                                    {formatAmount(summary.net)}
                                </p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                        <Tabs value={tab} onValueChange={(v) => setTab(v as FilterTab)} className="w-full lg:w-auto">
                            <TabsList className="grid grid-cols-4 w-full lg:w-auto">
                                <TabsTrigger value="all">{t("loansPage.tabAll")}</TabsTrigger>
                                <TabsTrigger value="lent">{t("loansPage.tabLent")}</TabsTrigger>
                                <TabsTrigger value="borrowed">{t("loansPage.tabBorrowed")}</TabsTrigger>
                                <TabsTrigger value="settled">{t("loansPage.tabSettled")}</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full lg:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t("loansPage.searchPlaceholder")}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    {filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center mb-4">
                                <HandCoins className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-foreground">{t("loansPage.empty")}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{t("loansPage.emptyDesc")}</p>
                            <Button onClick={openAdd} className="mt-4 gradient-primary hover:opacity-90">
                                <Plus className="w-4 h-4 mr-2" />
                                {t("loansPage.addLoan")}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((loan) => {
                                const isLent = loan.type === "lent";
                                const isSettled = loan.status === "settled";
                                return (
                                    <div
                                        key={loan.id}
                                        className={cn(
                                            "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all",
                                            isSettled && "opacity-60"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                                                isLent ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                                            )}
                                        >
                                            {isLent ? (
                                                <ArrowUpRight className="w-5 h-5" />
                                            ) : (
                                                <ArrowDownLeft className="w-5 h-5" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className={cn("font-semibold text-foreground", isSettled && "line-through")}>
                                                    {loan.person}
                                                </p>
                                                <Badge
                                                    variant={isLent ? "default" : "destructive"}
                                                    className={cn(isLent && "bg-primary/15 text-primary hover:bg-primary/20")}
                                                >
                                                    {isLent ? t("loansPage.lent") : t("loansPage.borrowed")}
                                                </Badge>
                                                {isSettled && (
                                                    <Badge variant="outline" className="gap-1">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {t("loansPage.settled")}
                                                    </Badge>
                                                )}
                                            </div>
                                            {loan.description && (
                                                <p className="text-sm text-muted-foreground mt-0.5 truncate">
                                                    {loan.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(loan.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-3">
                                            <p
                                                className={cn(
                                                    "text-lg font-bold whitespace-nowrap",
                                                    isLent ? "text-primary" : "text-destructive"
                                                )}
                                            >
                                                {isLent ? "+" : "−"}
                                                {formatAmount(loan.amount)}
                                            </p>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => toggleSettled(loan.id)}
                                                    title={isSettled ? t("loansPage.markOpen") : t("loansPage.markSettled")}
                                                >
                                                    {isSettled ? (
                                                        <RotateCcw className="w-4 h-4" />
                                                    ) : (
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => openEdit(loan)}>
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setDeleteId(loan.id)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <LoanFormDialog open={dialogOpen} onOpenChange={setDialogOpen} loan={editingLoan} />

            <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("loansPage.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("loansPage.deleteDesc")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t("common.delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}