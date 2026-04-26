'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { SimplifiedAnalysisResult, FullAnalysisResult } from '@/types/analys';

type Step = 1 | 2 | 3;

interface AnalysisData {
  fileName: string;
  cvText: string;
  extractedSkills: string[];
  extractedExperience: string[];
  extractedEducation: string[];
}

export default function AnalysisPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [fileName, setFileName] = useState('');

  const [editableSkills, setEditableSkills] = useState<string[]>([]);
  const [editableExperience, setEditableExperience] = useState<string[]>([]);
  const [editableEducation, setEditableEducation] = useState<string[]>([]);

  const [result, setResult] = useState<SimplifiedAnalysisResult | FullAnalysisResult | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Kunde inte läsa filen');
        return;
      }

      setCvFile(file);
      setCvText(data.text);
      setFileName(data.fileName);

      // Extract data using AI
      await extractData(data.text);
    } catch {
      setError('Något gick fel vid uppladdningen');
    } finally {
      setLoading(false);
    }
  };

  const extractData = async (text: string) => {
    try {
      const res = await fetch('/api/analys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText: text,
          profileId: '',
          isFreeSample: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Kunde inte analysera CV:t');
        return;
      }

      setEditableSkills(data.skills || []);
      setEditableExperience(data.experience || []);
      setEditableEducation(data.education || []);
      setResult(data);
      setStep(2);
    } catch {
      setError('Kunde inte analysera CV:t');
    }
  };

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch('/api/analys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText,
          profileId: user?.id || '',
          isFreeSample: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Något gick fel');
        return;
      }

      setResult(data);
      setStep(3);
    } catch {
      setError('Kunde inte köra analysen');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const isFreeSample = result?.isFreeSample === true;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className={`font-medium ${step >= 1 ? 'text-[#0033A0]' : 'text-slate-400'}`}>
            1. Ladda upp CV
          </span>
          <span className={`font-medium ${step >= 2 ? 'text-[#0033A0]' : 'text-slate-400'}`}>
            2. Granska
          </span>
          <span className={`font-medium ${step >= 3 ? 'text-[#0033A0]' : 'text-slate-400'}`}>
            3. Resultat
          </span>
        </div>
        <Progress value={step * 33.33} className="h-2" />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* Step 1: Upload CV */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ladda upp ditt CV</h1>
          <p className="text-slate-500 mb-6">
            Ladda upp ditt CV i PDF, DOCX eller TXT-format.
            AI:n extraherar dina kompetenser och erfarenheter.
          </p>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-[#0033A0] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {loading ? (
              <div className="text-slate-500">Laddar...</div>
            ) : cvFile ? (
              <div>
                <p className="font-medium text-slate-900">{fileName}</p>
                <p className="text-sm text-slate-500">Klicka för att byta fil</p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="font-medium text-slate-700">Dra och slapp eller klicka for att valja fil</p>
                <p className="text-sm text-slate-500 mt-1">PDF, DOCX eller TXT (max 10 MB)</p>
              </div>
            )}
          </div>

          {cvText && (
            <div className="mt-6">
              <Button onClick={() => setStep(2)} className="w-full">
                Fortsatt
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review Data */}
      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Granskaextraherad data</h1>
          <p className="text-slate-500 mb-6">
            AI:n har extraherat foljande fran ditt CV. Du kan redigera har.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kompetenser
              </label>
              <textarea
                value={editableSkills.join(', ')}
                onChange={(e) => setEditableSkills(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm"
                placeholder="Kompetens 1, Kompetens 2, ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Erfarenhet
              </label>
              <textarea
                value={editableExperience.join(', ')}
                onChange={(e) => setEditableExperience(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm"
                placeholder="Erfarenhet 1, Erfarenhet 2, ..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Utbildning
              </label>
              <textarea
                value={editableEducation.join(', ')}
                onChange={(e) => setEditableEducation(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm"
                placeholder="Utbildning 1, Utbildning 2, ..."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>
              Tillbaka
            </Button>
            <Button onClick={handleRunAnalysis} disabled={loading} className="flex-1">
              Kora analys
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && result && (
        <div className="space-y-6">
          {/* Free Sample Banner */}
          {isFreeSample && (
            <div className="bg-[#0033A0] text-white p-4 rounded-lg">
              <p className="font-medium">Gratis forenklad rapport</p>
              <p className="text-sm text-white/80 mt-1">
                Du ser nu en forenklad variant. Uppgradera for full rapport.
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Din analys</h1>

            {/* Skills */}
            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                Dina kompetenser
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                Erfarenhet
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.experience.map((exp, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                    {exp}
                  </span>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="mb-6">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                Utbildning
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.education.map((edu, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                    {edu}
                  </span>
                ))}
              </div>
            </div>

            {/* Summary */}
            {'summary_sv' in result && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Sammanfattning
                </h2>
                <p className="text-slate-700">{result.summary_sv}</p>
              </div>
            )}

            {/* Gap Items (Free Sample) */}
            {'gap_items' in result && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Kompetensgap
                </h2>
                <ul className="space-y-2">
                  {result.gap_items.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-slate-700">{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full Results */}
            {'gap_summary_sv' in result && (
              <>
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Gap-analys
                  </h2>
                  <p className="text-slate-700">{result.gap_summary_sv}</p>
                </div>

                <div className="mb-6">
                  <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Rekommendationer
                  </h2>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#00A651] mt-1">•</span>
                        <span className="text-slate-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Matcherade yrken
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_occupations.map((occ, i) => (
                      <span key={i} className="px-3 py-1 bg-[#0033A0]/10 text-[#0033A0] rounded-full text-sm">
                        {occ}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                    Utbildningsvagar
                  </h2>
                  <ul className="space-y-2">
                    {result.education_paths.map((path, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#0033A0] mt-1">•</span>
                        <span className="text-slate-700">{path}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* Upgrade CTA for Free Sample */}
          {isFreeSample && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Uppgradera for full rapport
                </h2>
                <p className="text-slate-500 mb-6">
                  Fa detaljerad gap-analys, rekommendationer och utbildningsvagar for bara 19 kr/mån.
                </p>
                <Link href="/konto">
                  <Button> Kop full rapport </Button>
                </Link>
              </div>
            </div>
          )}

          {/* New Analysis */}
          <div className="text-center">
            <Button variant="outline" onClick={() => { setStep(1); setCvFile(null); setCvText(''); setResult(null); }}>
              Gora ny analys
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}