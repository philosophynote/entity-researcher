'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * 企業候補型
 */
type CompanyCandidate = {
  corporateNumber: string;
  name: string;
  address: string;
};

/**
 * 企業情報型（APIスキーマと合わせる）
 */
type CompanyInfo = {
  companyName: string;
  corporateNumber: string;
  address?: string;
  corporateUrl: string;
  landingPages: string[];
  industry: string;
  phone: string;
  employees: number;
  founded: string;
  overview: string;
  insuredStatus: string;
  insuredCount: number;
  prRisks: { url: string; label: string; reason: string }[];
  newsRisks: { url: string; label: string; reason: string }[];
};

export default function Home() {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);
  const [selected, setSelected] = useState<CompanyCandidate | null>(null);
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 企業候補検索
  const searchCandidates = async () => {
    setError("");
    setCandidates([]);
    setSelected(null);
    setInfo(null);
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch("/api/company-candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error("検索に失敗しました");
      console.log(res);
      const data = await res.json();
      console.log(data);
      setCandidates(data);
    } catch (e) {
      setError("企業候補の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  // 企業情報取得
  const fetchInfo = async (candidate: CompanyCandidate) => {
    setError("");
    setInfo(null);
    setSelected(candidate);
    setLoading(true);
    try {
      const res = await fetch("/api/company-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corporateNumber: candidate.corporateNumber, companyName: candidate.name }),
      });
      if (!res.ok) throw new Error("情報取得に失敗しました");
      const data = await res.json();
      setInfo(data);
    } catch (e) {
      setError("企業情報の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">企業情報リサーチャー</h1>
      <div className="flex gap-2 mb-4">
        <input
          className="border rounded px-3 py-2 flex-1"
          type="text"
          placeholder="企業名を入力"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && searchCandidates()}
        />
        <Button onClick={searchCandidates} disabled={loading || !query}>
          検索
        </Button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {/* 候補表示 */}
      {candidates.length > 0 && (
        <div className="mb-6">
          <div className="mb-2 text-sm">候補から選択してください：</div>
          <ul className="space-y-2">
            {candidates.map(c => (
              <li key={c.corporateNumber}>
                <Button
                  variant={selected?.corporateNumber === c.corporateNumber ? "default" : "outline"}
                  onClick={() => fetchInfo(c)}
                  disabled={loading}
                >
                  {c.name}（{c.address}）
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* 企業情報テーブル */}
      {info && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">項目名</th>
                <th className="border px-2 py-1">内容</th>
                <th className="border px-2 py-1">情報源URL</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-2 py-1">法人番号</td>
                <td className="border px-2 py-1">{info.corporateNumber}</td>
                <td className="border px-2 py-1">-</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">企業名</td>
                <td className="border px-2 py-1">{info.companyName}</td>
                <td className="border px-2 py-1">-</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">コーポレートURL</td>
                <td className="border px-2 py-1">
                  <a href={info.corporateUrl} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{info.corporateUrl}</a>
                </td>
                <td className="border px-2 py-1">{info.corporateUrl}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">LP URL</td>
                <td className="border px-2 py-1">
                  {info.landingPages[0] ? (
                    <a href={info.landingPages[0]} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{info.landingPages[0]}</a>
                  ) : '-'}
                </td>
                <td className="border px-2 py-1">{info.landingPages[0] || '-'}</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">業種</td>
                <td className="border px-2 py-1">{info.industry}</td>
                <td className="border px-2 py-1">-</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">電話番号</td>
                <td className="border px-2 py-1">{info.phone}</td>
                <td className="border px-2 py-1">-</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">従業員数</td>
                <td className="border px-2 py-1">{info.employees}</td>
                <td className="border px-2 py-1">-</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">設立年月日</td>
                <td className="border px-2 py-1">{info.founded}</td>
                <td className="border px-2 py-1">-</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">企業概要</td>
                <td className="border px-2 py-1">{info.overview}</td>
                <td className="border px-2 py-1">-</td>
              </tr>
              <tr>
                <td className="border px-2 py-1">社会保険加入状況</td>
                <td className="border px-2 py-1">{info.insuredStatus}（被保険者数: {info.insuredCount}人）</td>
                <td className="border px-2 py-1">-</td>
              </tr>
              {/* プレスリリース */}
              {info.prRisks.map((pr, i) => (
                <tr key={"pr-"+i}>
                  <td className="border px-2 py-1">プレスリリース</td>
                  <td className="border px-2 py-1">
                    <a href={pr.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{pr.label}</a><br />{pr.reason}
                  </td>
                  <td className="border px-2 py-1">{pr.url}</td>
                </tr>
              ))}
              {/* ニュース */}
              {info.newsRisks.map((n, i) => (
                <tr key={"news-"+i}>
                  <td className="border px-2 py-1">ニュース</td>
                  <td className="border px-2 py-1">
                    <a href={n.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{n.label}</a><br />{n.reason}
                  </td>
                  <td className="border px-2 py-1">{n.url}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
