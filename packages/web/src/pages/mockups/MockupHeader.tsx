import { useState, useRef, useEffect } from 'react';

type NavItem = { label: string; href: string; active?: boolean };

type Props = {
  activeLabel?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'リスト',    href: '/mockup/home' },
  { label: 'グループ',  href: '#' },
  { label: '定期リスト', href: '/mockup/recurring' },
  { label: '設定',      href: '/mockup/settings' },
];

export default function MockupHeader({ activeLabel }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="bg-primary-600 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/mockup" className="text-xl font-bold">Kaimemo</a>

        {/* PC: 横並びナビ */}
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          {NAV_ITEMS.map((item) => (
            item.href === '#'
              ? <span key={item.label} className="opacity-50 cursor-default">{item.label}</span>
              : <a key={item.label} href={item.href}
                  className={activeLabel === item.label
                    ? 'font-semibold border-b-2 border-white pb-0.5'
                    : 'opacity-75 hover:opacity-100 transition'}>
                  {item.label}
                </a>
          ))}
          {/* 通知ベル */}
          <a href="/mockup/header" className="relative opacity-75 hover:opacity-100 transition" title="通知">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
          </a>
          <span className="opacity-90">田中 太郎</span>
        </nav>

        {/* スマホ: ハンバーガーメニュー */}
        <div className="sm:hidden relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-2 opacity-75 hover:opacity-100 transition"
            aria-label="メニュー"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 text-gray-800">
              {NAV_ITEMS.map((item) => (
                item.href === '#'
                  ? <span key={item.label} className="block px-4 py-2.5 text-sm text-gray-300">{item.label}</span>
                  : <a key={item.label} href={item.href} onClick={() => setMenuOpen(false)}
                      className={`block px-4 py-2.5 text-sm hover:bg-gray-50 transition
                        ${activeLabel === item.label ? 'font-semibold text-primary-700' : 'text-gray-700'}`}>
                      {item.label}
                    </a>
              ))}
              <a href="/mockup/header" onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                通知
              </a>
              <div className="border-t border-gray-100 my-1" />
              <div className="px-4 py-2 text-sm text-gray-500">田中 太郎</div>
              <button className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
