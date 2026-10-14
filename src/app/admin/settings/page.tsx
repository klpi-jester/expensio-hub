import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings/settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Global store name and currency used across the POS and public menu.
        </p>
      </div>
      <SettingsForm
        initial={{
          store_name: settings.store_name,
          currency_code: settings.currency_code,
          currency_symbol: settings.currency_symbol,
        }}
      />
    </div>
  );
}
