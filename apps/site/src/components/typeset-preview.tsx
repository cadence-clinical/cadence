/** A live sample of Typeset for the docs. The content is synthetic. */
export function TypesetPreview({ preset }: { preset?: "compact" | "reading" }) {
  return (
    <div className="not-prose preview-surface my-6 rounded-lg border p-6">
      <article className={preset ? `typeset typeset-${preset}` : "typeset"}>
        <h2>Preparing for your clinic visit</h2>
        <p>
          Bring your referral letter and <a href="#usage">a list of your current medicines</a>,
          including anything you buy without a prescription.
        </p>
        <ol>
          <li>Check in at the reception desk on Level 2.</li>
          <li>A nurse will see you first, then a doctor.</li>
        </ol>
        <dl>
          <dt>Clinic</dt>
          <dd>Outpatients, Level 2</dd>
        </dl>
      </article>
    </div>
  );
}
