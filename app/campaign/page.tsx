'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { ChevronLeft, ChevronRight, Home, Plus, Send } from 'lucide-react';
import {
  autoMapTokens,
  isEmailAddress,
  mergeTokensFromText,
  parseCsvTable,
} from '@/app/lib/mailer/csv-emails';
import type { CampaignDraft } from '@/app/lib/mailer/campaign-fields';
import { LoadingButton, useAsyncAction } from '@/app/components/interior/loading-button';
import { FloatingLabelInput } from '@/app/components/interior/floating-label';
import { TagInput } from '@/app/components/interior/tag-input';
import { LoadMore } from '@/app/components/interior/load-more';
import { ExpandingSearch } from '@/app/components/interior/expanding-search';
import { Modal } from '@/app/components/interior/modal';
import { Dropdown } from '@/app/components/interior/dropdown';
import { SegmentedControl } from '@/app/components/interior/segmented-control';
import { GmailComposer } from '@/app/components/campaign/gmail-composer';
import { FieldInfo } from '@/app/components/campaign/field-info';
import { htmlHasText } from '@/app/lib/mailer/html-text';
import { MAX_CSV_BYTES, formatBytes, isCsvFile } from '@/app/lib/files';

const PAGE = 20;

const emptyDraft = () => ({
  activeId: null as string | null,
  subject: '',
  content: '',
  fromName: '',
  fromEmail: '',
  replyTo: '',
  emails: [] as string[],
  csvHeaders: [] as string[],
  recipientRows: [] as Record<string, string>[],
  csvColumn: '',
  overrides: {} as Record<string, string>,
});

export default function CampaignPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<CampaignDraft[]>([]);
  const [form, setForm] = useState(emptyDraft);
  const [csvError, setCsvError] = useState('');
  const [mappingOpen, setMappingOpen] = useState(false);
  const [emailsOpen, setEmailsOpen] = useState(false);
  const [emailQuery, setEmailQuery] = useState('');
  const [emailShown, setEmailShown] = useState(PAGE);
  const [testOpen, setTestOpen] = useState(false);
  const [testMode, setTestMode] = useState('manual');
  const [testTags, setTestTags] = useState<string[]>([]);
  const [testRows, setTestRows] = useState<Record<string, string>[]>([]);
  const [testError, setTestError] = useState('');
  const [testResult, setTestResult] = useState('');
  const [draftsOpen, setDraftsOpen] = useState(true);
  const tokens = useMemo(
    () => mergeTokensFromText(`${form.subject}\n${form.content}`),
    [form.subject, form.content],
  );
  const { mapping, missing } = useMemo(
    () => autoMapTokens(tokens, form.csvHeaders, form.overrides),
    [tokens, form.csvHeaders, form.overrides],
  );
  const mappingOk = missing.length === 0;
  const fromOk = isEmailAddress(form.fromEmail);
  const replyOk = isEmailAddress(form.replyTo || form.fromEmail);
  const canCommit = mappingOk && fromOk && replyOk && form.fromName.trim().length > 0;
  const canCompose = canCommit && form.subject.trim().length > 0 && htmlHasText(form.content);
  const canSend = canCompose && form.emails.length > 0;

  // Open the mapping dialog when a token stops mapping (adjust state during render, not in an effect).
  const [prevMappingOk, setPrevMappingOk] = useState(mappingOk);
  if (prevMappingOk !== mappingOk) {
    setPrevMappingOk(mappingOk);
    if (!mappingOk) setMappingOpen(true);
  }

  const fetchDrafts = useCallback(async (): Promise<CampaignDraft[] | null> => {
    const res = await fetch('/api/campaigns');
    if (res.status === 401) {
      router.replace('/login');
      return null;
    }
    const payload = (await res.json()) as { campaigns?: CampaignDraft[]; error?: string };
    return payload.campaigns ?? [];
  }, [router]);

  useEffect(() => {
    let active = true;
    fetchDrafts().then((list) => {
      if (active && list) setDrafts(list);
    });
    return () => {
      active = false;
    };
  }, [fetchDrafts]);

  const loadDrafts = useCallback(async () => {
    const list = await fetchDrafts();
    if (list) setDrafts(list);
  }, [fetchDrafts]);

  const applyDraft = (draft: CampaignDraft) => {
    setForm({
      activeId: draft.id,
      subject: draft.subject,
      content: draft.content,
      fromName: draft.from_name ?? '',
      fromEmail: draft.from_email ?? '',
      replyTo: draft.reply_to ?? '',
      emails: Array.isArray(draft.recipients) ? draft.recipients : [],
      csvHeaders: draft.csv_headers ?? [],
      recipientRows: draft.recipient_rows ?? [],
      csvColumn: '',
      overrides: draft.merge_mapping ?? {},
    });
    setCsvError('');
    setEmailShown(PAGE);
  };

  const readCsv = (file: File, into: 'campaign' | 'test') => {
    setCsvError('');
    setTestError('');
    if (!isCsvFile(file)) {
      const msg = 'Use a .csv file.';
      if (into === 'test') setTestError(msg);
      else setCsvError(msg);
      return;
    }
    if (file.size > MAX_CSV_BYTES) {
      const msg = `CSV is too large (${formatBytes(file.size)}). Max is ${formatBytes(MAX_CSV_BYTES)}.`;
      if (into === 'test') setTestError(msg);
      else setCsvError(msg);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCsvTable(String(reader.result ?? ''));
        if (into === 'test') {
          setTestRows(parsed.rows);
        } else {
          setForm((prev) => ({
            ...prev,
            emails: parsed.emails,
            csvHeaders: parsed.headers,
            recipientRows: parsed.rows,
            csvColumn: parsed.emailColumn,
          }));
          setEmailShown(PAGE);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Could not read that CSV.';
        if (into === 'test') setTestError(msg);
        else setCsvError(msg);
      }
    };
    reader.readAsText(file);
  };

  const campaignDrop = useDropzone({
    multiple: false,
    onDrop: (files) => {
      const file = files[0];
      if (file) readCsv(file, 'campaign');
    },
  });
  const testDrop = useDropzone({
    multiple: false,
    onDrop: (files) => {
      const file = files[0];
      if (file) readCsv(file, 'test');
    },
  });

  const body = () => ({
    subject: form.subject,
    content: form.content,
    recipients: form.emails,
    from_name: form.fromName,
    from_email: form.fromEmail,
    reply_to: form.replyTo || form.fromEmail,
    csv_headers: form.csvHeaders,
    recipient_rows: form.recipientRows,
    merge_mapping: mapping,
  });

  const save = async () => {
    if (!canCommit) {
      setMappingOpen(!mappingOk);
      throw new Error('Fix sender identity and merge fields before saving.');
    }
    const res = await fetch(form.activeId ? `/api/campaigns/${form.activeId}` : '/api/campaigns', {
      method: form.activeId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body()),
    });
    const payload = (await res.json()) as { campaign?: CampaignDraft; error?: string };
    if (!res.ok || !payload.campaign) {
      throw new Error(payload.error ?? 'Could not save draft.');
    }
    applyDraft(payload.campaign);
    await loadDrafts();
  };

  const newDraft = () => {
    setForm(emptyDraft());
    setCsvError('');
  };

  const sendCampaign = async () => {
    if (!canSend) throw new Error('Subject, body, sender, recipients, and merge fields are required to send.');
    const res = await fetch('/api/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body(),
        emails: form.emails,
        rows: form.recipientRows,
      }),
    });
    const payload = (await res.json()) as { sent?: string[]; failed?: { email: string; error: string }[]; error?: string };
    if (!res.ok) throw new Error(payload.error ?? 'Send failed.');
    const fail = payload.failed ?? [];
    if (fail.length > 0) throw new Error(`${fail.length} mail(s) failed.`);
  };

  const sendAction = useAsyncAction({ action: sendCampaign });

  const sendTest = async () => {
    if (!canCompose) throw new Error('Subject, body, sender, and merge fields are required to send.');
    const emails = testMode === 'manual' ? testTags : testRows.map((row) => String(row.email ?? row.Email ?? ''));
    const rows = testMode === 'csv' ? testRows : testTags.map((email) => ({ email }));
    const res = await fetch('/api/campaigns/test-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body(),
        emails,
        rows,
      }),
    });
    const payload = (await res.json()) as { sent?: string[]; failed?: { email: string; error: string }[]; error?: string };
    if (!res.ok) throw new Error(payload.error ?? 'Test send failed.');
    const fail = payload.failed ?? [];
    setTestResult(
      `Sent ${payload.sent?.length ?? 0}. Failed ${fail.length}${fail[0] ? `: ${fail[0].email} — ${fail[0].error}` : ''}.`,
    );
    if (fail.length > 0) throw new Error(`${fail.length} test mail(s) failed.`);
  };

  const filteredEmails = form.emails.filter((email) =>
    email.toLowerCase().includes(emailQuery.trim().toLowerCase()),
  );
  const visibleEmails = filteredEmails.slice(0, emailShown);

  const removeEmail = (email: string) => {
    setForm((prev) => ({
      ...prev,
      emails: prev.emails.filter((e) => e !== email),
      recipientRows: prev.recipientRows.filter((row) => {
        const value = String(row.email ?? row.Email ?? '').toLowerCase();
        return value !== email;
      }),
    }));
  };

  return (
    <div className="min-h-screen bg-base flex flex-col">
      <header className="bg-surface border-b border-border-default px-5 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            aria-label="Home"
            className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-border-default bg-raised px-3 text-sm text-text-primary hover:bg-hover"
            onClick={() => router.push('/')}
          >
            <Home className="size-4" strokeWidth={1.75} />
            Home
          </button>
          <div className="min-w-0">
            <h1 className="text-text-primary text-2xl md:text-3xl font-semibold tracking-wide truncate">Campaign</h1>
            <p className="subtext mt-1 hidden sm:block">Drafts plus send.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LoadingButton
            disabled={!canCommit}
            pendingLabel="Saving"
            successLabel="Saved"
            onAction={save}
            className="border-border-default bg-raised text-text-primary shadow-none hover:bg-hover dark:bg-raised dark:text-text-primary"
          >
            Save draft
          </LoadingButton>
          <button
            type="button"
            disabled={!canSend || sendAction.pending}
            aria-busy={sendAction.pending || undefined}
            className="inline-flex h-9 items-center gap-1.5 rounded-[9px] bg-accent px-3.5 text-[13px] font-medium text-black disabled:opacity-40"
            onClick={() => sendAction.run()}
          >
            <Send className="size-4" strokeWidth={1.75} />
            {sendAction.pending ? 'Sending' : sendAction.status === 'success' ? 'Sent' : sendAction.status === 'error' ? 'Retry' : 'Send'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <aside
          className={`border-b lg:border-b-0 lg:border-r border-border-default overflow-auto shrink-0 transition-[width] duration-200 ${
            draftsOpen ? 'w-44 p-3' : 'w-12 p-2'
          }`}
        >
          <div className={`flex items-center ${draftsOpen ? 'justify-between' : 'flex-col gap-2'}`}>
            {draftsOpen ? <p className="text-text-secondary text-xs tracking-wide uppercase">Drafts</p> : null}
            <button
              type="button"
              aria-label={draftsOpen ? 'Collapse drafts' : 'Expand drafts'}
              className="inline-flex size-8 items-center justify-center rounded-[9px] text-text-secondary hover:bg-raised hover:text-text-primary"
              onClick={() => setDraftsOpen((open) => !open)}
            >
              {draftsOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          </div>
          <button
            type="button"
            aria-label="New draft"
            className={`mt-3 inline-flex items-center justify-center rounded-[10px] border border-border-default bg-raised text-text-primary text-sm hover:bg-hover ${
              draftsOpen ? 'w-full gap-1.5 px-3 py-2' : 'size-8 mx-auto'
            }`}
            onClick={newDraft}
          >
            <Plus className="size-4 shrink-0" strokeWidth={1.75} />
            {draftsOpen ? 'New draft' : null}
          </button>
          {draftsOpen ? (
            <ul className="mt-3 space-y-2">
              {drafts.map((draft) => (
                <li key={draft.id}>
                  <button
                    type="button"
                    onClick={() => applyDraft(draft)}
                    className={`w-full rounded-[10px] px-3 py-2 text-left text-sm ${
                      form.activeId === draft.id ? 'bg-accent-dim text-accent' : 'bg-raised text-text-primary'
                    }`}
                  >
                    {draft.subject.trim() || 'Untitled'}
                    <span className="block text-xs text-text-secondary">{draft.recipients.length} recipients</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>

        <main className="flex-1 min-w-0 p-5 md:p-8 flex flex-col gap-4 min-h-0 overflow-auto">
          <section>
            <p className="text-[12.5px] font-medium text-text-secondary">From</p>
            <p className="mt-1 mb-2 text-xs text-text-secondary">
              Set who sends this campaign and where replies should go.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="flex items-end gap-1">
                <FloatingLabelInput
                  label="From name"
                  value={form.fromName}
                  onChange={(value) => setForm((prev) => ({ ...prev, fromName: value }))}
                />
                <FieldInfo label="From name">
                  The name people see next to the sender, for example Acme Events.
                </FieldInfo>
              </div>
              <div className="flex items-end gap-1">
                <FloatingLabelInput
                  label="From email"
                  type="email"
                  invalid={form.fromEmail.length > 0 && !fromOk}
                  value={form.fromEmail}
                  onChange={(value) => setForm((prev) => ({ ...prev, fromEmail: value }))}
                />
                <FieldInfo label="From email">
                  The address shown as the sender. It must be a mailbox your mail server can send from.
                </FieldInfo>
              </div>
              <div className="flex items-end gap-1">
                <FloatingLabelInput
                  label="Reply-to email"
                  type="email"
                  invalid={form.replyTo.length > 0 && !isEmailAddress(form.replyTo)}
                  value={form.replyTo}
                  onChange={(value) => setForm((prev) => ({ ...prev, replyTo: value }))}
                />
                <FieldInfo label="Reply-to email">
                  Where replies go. Use this when replies should not land in the from address.
                </FieldInfo>
              </div>
            </div>
          </section>
          <div>
            <p className="text-xs text-text-secondary">Write a short description of the email</p>
            <FloatingLabelInput
              label="Subject"
              value={form.subject}
              onChange={(value) => setForm((prev) => ({ ...prev, subject: value }))}
            />
          </div>
          <GmailComposer
            value={form.content}
            onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
          />
        </main>

        <aside className="w-full lg:w-[280px] shrink-0 border-t lg:border-t-0 lg:border-l border-border-default p-4 overflow-auto">
          <div
            {...campaignDrop.getRootProps()}
            className={`rounded-[14px] border border-dashed px-4 py-10 text-center cursor-pointer ${
              campaignDrop.isDragActive ? 'border-accent bg-accent-dim' : 'border-border-strong bg-raised'
            }`}
          >
            <input {...campaignDrop.getInputProps()} />
            <p className="text-text-primary text-sm font-medium tracking-wide">Upload CSV</p>
            <p className="subtext mt-2">Email column is detected.</p>
          </div>
          {csvError ? <p className="mt-3 text-sm text-danger">{csvError}</p> : null}
          {form.emails.length > 0 ? (
            <div className="mt-3">
              <p className="text-sm text-text-secondary">
                {form.emails.length} recipients{form.csvColumn ? ` from “${form.csvColumn}”` : ''} from email.
              </p>
              <button
                type="button"
                className="mt-1 text-sm text-accent"
                onClick={() => {
                  setEmailsOpen(true);
                  setEmailShown(PAGE);
                }}
              >
                Show all emails
              </button>
            </div>
          ) : null}

          <p className="mt-6 text-text-secondary text-xs tracking-wide uppercase">Sending options</p>
          <button
            type="button"
            disabled={!canCompose}
            className="mt-3 w-full rounded-[10px] border border-border-default bg-raised px-3 py-2 text-sm font-medium text-text-primary disabled:opacity-40"
            onClick={() => {
              setTestOpen(true);
              setTestResult('');
              setTestError('');
            }}
          >
            Send test email
          </button>
          {!canSend ? (
            <p className="mt-2 text-xs text-danger">
              {!fromOk || !form.fromName.trim() || !replyOk
                ? 'Add from name, from email, and reply-to.'
                : !form.subject.trim() || !htmlHasText(form.content)
                  ? 'Add a subject and email body before sending.'
                  : form.emails.length === 0
                    ? 'Upload a CSV of recipients before Send.'
                    : `Map missing fields: ${missing.map((t) => `{{${t}}}`).join(', ')}`}
            </p>
          ) : null}
        </aside>
      </div>

      <Modal
        open={mappingOpen && !mappingOk}
        onClose={() => setMappingOpen(false)}
        title="CSV columns are missing"
        description="Merge fields must match a CSV header before you can save or send."
        maxWidth={480}
      >
        <ul className="space-y-3">
          {missing.map((token) => (
            <li key={token} className="space-y-1">
              <p className="text-sm text-text-primary">
                {'{{'}
                {token}
                {'}}'} has no column named “{token}”.
              </p>
              {form.csvHeaders.length > 0 ? (
                <Dropdown
                  label={`Map ${token}`}
                  placeholder="Choose a CSV column"
                  items={form.csvHeaders.map((header) => ({ value: header, label: header }))}
                  value={form.overrides[token]}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, overrides: { ...prev.overrides, [token]: value } }))
                  }
                />
              ) : (
                <p className="text-xs text-text-secondary">Upload a CSV that includes that column, or remove the token from the email.</p>
              )}
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        open={emailsOpen}
        onClose={() => setEmailsOpen(false)}
        title="Recipients"
        maxWidth={480}
        maxHeight="min(82vh, 720px)"
      >
        <ExpandingSearch
          placeholder="Search emails"
          defaultOpen
          resultCount={filteredEmails.length}
          onSearch={setEmailQuery}
        />
        <ul className="mt-3 max-h-[420px] overflow-auto space-y-1">
          {visibleEmails.map((email) => (
            <li key={email} className="flex items-center justify-between rounded-[10px] bg-raised px-3 py-2 text-sm">
              <span className="truncate text-text-primary">{email}</span>
              <button type="button" className="text-danger text-xs" onClick={() => removeEmail(email)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <LoadMore
          auto={false}
          hasMore={emailShown < filteredEmails.length}
          onLoad={() => {
            setEmailShown(filteredEmails.length);
          }}
          labels={{ idle: 'Load more', loading: 'Loading', error: 'Retry', end: 'All emails shown' }}
        />
      </Modal>

      <Modal
        open={testOpen}
        onClose={() => setTestOpen(false)}
        title="Send test email"
        description="Manual addresses or another CSV. Capped at 25."
        maxWidth={520}
        footer={
          <LoadingButton pendingLabel="Sending" successLabel="Sent" disabled={!canCompose} onAction={sendTest}>
            Send tests
          </LoadingButton>
        }
      >
        <SegmentedControl
          label="Test recipients"
          value={testMode}
          onValueChange={setTestMode}
          options={[
            { value: 'manual', label: 'Type emails' },
            { value: 'csv', label: 'Test CSV' },
          ]}
        />
        <div className="mt-4">
          {testMode === 'manual' ? (
            <TagInput
              label="Test addresses"
              placeholder="name@domain.com"
              separators={[',', ';']}
              value={testTags}
              onChange={setTestTags}
              validate={(candidate) => isEmailAddress(candidate)}
            />
          ) : (
            <div
              {...testDrop.getRootProps()}
              className="rounded-[10px] border border-dashed border-border-strong px-4 py-8 text-center cursor-pointer"
            >
              <input {...testDrop.getInputProps()} />
              <p className="text-sm text-text-primary">Drop a test CSV</p>
              {testRows.length > 0 ? (
                <p className="subtext mt-2">{testRows.length} test rows loaded.</p>
              ) : null}
            </div>
          )}
        </div>
        {testError ? <p className="mt-3 text-sm text-danger">{testError}</p> : null}
        {testResult ? <p className="mt-3 text-sm text-text-secondary">{testResult}</p> : null}
      </Modal>
    </div>
  );
}
