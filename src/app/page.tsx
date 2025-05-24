'use client';
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

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
type FieldWithSourceString = {
  value: string;
  source: string[];
};
type FieldWithSourceStringArray = {
  value: string[];
  source: string[];
};
type FieldWithSourceNumber = {
  value: number;
  source: string[];
};

type CompanyInfo = {
  representative: FieldWithSourceString;
  corporateUrl: FieldWithSourceString;
  landingPages: FieldWithSourceStringArray;
  phone: FieldWithSourceString;
  employees: FieldWithSourceNumber;
  founded: FieldWithSourceString;
  overview: FieldWithSourceString;
  industry: string;
  // 追加情報（社会保険やリスク等は従来通り）
  insuredStatus?: string;
  insuredCount?: number;
  prRisks?: { url: string; label: string; reason: string }[];
  newsRisks?: { url: string; label: string; reason: string }[];
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
          <div className="flex flex-col gap-4">
            {candidates.map(c => (
              <Card
                key={c.corporateNumber}
                className={`flex flex-row items-center gap-6 px-6 py-4 transition-colors duration-150 ${selected?.corporateNumber === c.corporateNumber ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex items-center space-x-4">
                    <div className="text-xs text-gray-500">法人番号：{c.corporateNumber}</div>
                    <div className="flex items-center text-sm text-gray-700">
                      <MapPin className="w-4 h-4 mr-1 text-blue-400" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  </div>
                  <div className="font-semibold text-lg truncate">{c.name}</div>
                </div>
                <div className="flex-shrink-0">
                  <Button
                    variant={selected?.corporateNumber === c.corporateNumber ? "default" : "outline"}
                    onClick={() => fetchInfo(c)}
                    disabled={loading}
                  >
                    {selected?.corporateNumber === c.corporateNumber ? '選択中' : '選択'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* 企業情報・リスクテーブル分割表示 */}
      {info && (
        <div className="space-y-8">
          {/* 企業情報テーブル */}
          <div className="overflow-x-auto">
            <div className="font-bold text-lg mb-2">企業情報</div>
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
                  <td className="border px-2 py-1">代表者名</td>
                  <td className="border px-2 py-1">{info.representative.value}</td>
                  <td className="border px-2 py-1">
                    <ul>
                      {info.representative.source.map((url, i) => (
                        <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">コーポレートURL</td>
                  <td className="border px-2 py-1">
                    <a href={info.corporateUrl.value} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{info.corporateUrl.value}</a>
                  </td>
                  <td className="border px-2 py-1">
                    <ul>
                      {info.corporateUrl.source.map((url, i) => (
                        <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">LP URL</td>
                  <td className="border px-2 py-1">
                    {info.landingPages.value.length > 0 ? (
                      <ul>
                        {info.landingPages.value.map((lp, i) => (
                          <li key={i}><a href={lp} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{lp}</a></li>
                        ))}
                      </ul>
                    ) : '-'}
                  </td>
                  <td className="border px-2 py-1">
                    <ul>
                      {info.landingPages.source.map((url, i) => (
                        <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">業種</td>
                  <td className="border px-2 py-1">{info.industry}</td>
                  <td className="border px-2 py-1">-</td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">電話番号</td>
                  <td className="border px-2 py-1">{info.phone.value}</td>
                  <td className="border px-2 py-1">
                    <ul>
                      {info.phone.source.map((url, i) => (
                        <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">従業員数</td>
                  <td className="border px-2 py-1">{info.employees.value}</td>
                  <td className="border px-2 py-1">
                    <ul>
                      {info.employees.source.map((url, i) => (
                        <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">設立年月日</td>
                  <td className="border px-2 py-1">{info.founded.value}</td>
                  <td className="border px-2 py-1">
                    <ul>
                      {info.founded.source.map((url, i) => (
                        <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">企業概要</td>
                  <td className="border px-2 py-1">{info.overview.value}</td>
                  <td className="border px-2 py-1">
                    <ul>
                      {info.overview.source.map((url, i) => (
                        <li key={i}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></li>
                      ))}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td className="border px-2 py-1">社会保険加入状況</td>
                  <td className="border px-2 py-1">{info.insuredStatus}（被保険者数: {info.insuredCount}人）</td>
                  <td className="border px-2 py-1">-</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* プレスリリーステーブル */}
          {info.prRisks && info.prRisks.length > 0 && (
            <div className="overflow-x-auto">
              <div className="font-bold text-lg mb-2">プレスリリースリスク</div>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">タイトル</th>
                    <th className="border px-2 py-1">リスクレベル</th>
                    <th className="border px-2 py-1">判定理由</th>
                  </tr>
                </thead>
                <tbody>
                  {info.prRisks.map((pr, i) => (
                    <tr key={"pr-"+i}>
                      <td className="border px-2 py-1">
                        <a href={pr.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">title</a>
                      </td>
                      <td className="border px-2 py-1">{pr.label}</td>
                      <td className="border px-2 py-1">{pr.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* ニューステーブル */}
          {info.newsRisks && info.newsRisks.length > 0 && (
            <div className="overflow-x-auto">
              <div className="font-bold text-lg mb-2">ニュースリスク</div>
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">タイトル</th>
                    <th className="border px-2 py-1">リスクレベル</th>
                    <th className="border px-2 py-1">判定理由</th>
                  </tr>
                </thead>
                <tbody>
                  {info.newsRisks.map((n, i) => (
                    <tr key={"news-"+i}>
                      <td className="border px-2 py-1">
                        <a href={n.url} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">title</a>
                      </td>
                      <td className="border px-2 py-1">{n.label}</td>
                      <td className="border px-2 py-1">{n.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
