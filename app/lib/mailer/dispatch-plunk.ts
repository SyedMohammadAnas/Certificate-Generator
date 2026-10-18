import { applyMerge, autoMapTokens, isEmailAddress, mergeTokensFromText } from '@/app/lib/mailer/csv-emails';
import { htmlHasText, plunkSubject } from '@/app/lib/mailer/html-text';
import { sendPlunkEmail } from '@/app/lib/mailer/plunk-send';

export type DispatchInput = {
  subject?: string;
  content?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  csv_headers?: string[];
  merge_mapping?: Record<string, string>;
  rows?: Record<string, string>[];
  emails?: string[];
};

export type DispatchResult =
  | { ok: true; sent: string[]; failed: { email: string; error: string }[] }
  | { ok: false; error: string; status: number };

function recipientName(row: Record<string, string>, mapping: Record<string, string>): string | undefined {
  const mapped = mapping.name ? row[mapping.name] : undefined;
  const raw = mapped || row.name || row.Name;
  const value = String(raw ?? '').trim();
  return value || undefined;
}

export async function dispatchPlunk(input: DispatchInput, cap?: number): Promise<DispatchResult> {
  const fromEmail = String(input.from_email ?? '').toLowerCase();
  const fromName = String(input.from_name ?? '').trim();
  const replyTo = String(input.reply_to ?? fromEmail).toLowerCase();
  const subject = plunkSubject(String(input.subject ?? ''));
  const content = String(input.content ?? '');
  const headers = Array.isArray(input.csv_headers) ? input.csv_headers.map(String) : [];
  const tokens = mergeTokensFromText(`${subject}\n${content}`);
  const { mapping, missing } = autoMapTokens(tokens, headers, input.merge_mapping ?? {});
  if (missing.length > 0) {
    return {
      ok: false,
      status: 400,
      error: `Unmapped merge fields: ${missing.map((t) => `{{${t}}}`).join(', ')}`,
    };
  }
  if (!fromName || !isEmailAddress(fromEmail) || !isEmailAddress(replyTo)) {
    return { ok: false, status: 400, error: 'From name, from email, and reply-to are required.' };
  }
  if (!subject || !htmlHasText(content)) {
    return { ok: false, status: 400, error: 'Plunk requires a subject and HTML body.' };
  }

  const rows = Array.isArray(input.rows) ? input.rows : [];
  const emails = Array.isArray(input.emails)
    ? input.emails.map((e) => e.toLowerCase()).filter(isEmailAddress)
    : [];
  const jobs = rows.length > 0 ? rows : emails.map((email) => ({ email }));

  if (jobs.length === 0) {
    return { ok: false, status: 400, error: 'Add at least one recipient.' };
  }
  if (cap !== undefined && jobs.length > cap) {
    return { ok: false, status: 400, error: `This send is capped at ${cap} addresses.` };
  }

  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  for (const row of jobs) {
    const email = String((row as Record<string, string>).email ?? (row as Record<string, string>).Email ?? '').toLowerCase();
    if (!isEmailAddress(email)) {
      failed.push({ email: email || '(empty)', error: 'Not an email.' });
      continue;
    }
    const name = recipientName(row, mapping);
    try {
      await sendPlunkEmail({
        to: name ? { name, email } : email,
        subject: applyMerge(subject, row, mapping),
        body: applyMerge(content, row, mapping),
        from: { name: fromName, email: fromEmail },
        reply: replyTo,
      });
      sent.push(email);
    } catch (err) {
      failed.push({ email, error: err instanceof Error ? err.message : 'Send failed.' });
    }
  }
  return { ok: true, sent, failed };
}
