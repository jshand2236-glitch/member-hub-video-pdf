/** プレミアム限定：チェックするとプレミアムプランの会員だけが見られる。 */
export default function PremiumField({ defaultChecked = false, labelClass }: { defaultChecked?: boolean; labelClass: string }) {
  return (
    <div className="sm:col-span-2">
      <span className={labelClass}>プレミアム限定</span>
      <label className="mt-1 flex items-start gap-2.5 rounded-[4px] border border-line px-3 py-3 text-sm">
        <input type="checkbox" name="premiumOnly" defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-accent" />
        <span>
          プレミアムプランの会員だけが見られるようにする
          <span className="mt-0.5 block text-xs text-muted">
            ほかの会員にはタイトルだけが「プレミアムプラン限定」として表示されます。「無料公開」にもチェックした場合は無料公開が優先されます。
          </span>
        </span>
      </label>
    </div>
  );
}
