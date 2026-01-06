export default function Agreement() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-light mb-2 tracking-tight">
          Enfora Task Commitment, Evidence Submission & Verification Agreement
        </h1>
        <p className="text-gray-400 mb-8">Last Updated: January 5, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <p>
            This <strong>Task Commitment, Evidence Submission & Verification Agreement</strong> ("Agreement")
            governs your creation of tasks, submission of evidence, and participation in enforcement
            mechanisms on Enfora ("Enfora," "we," "us," or "our").
          </p>

          <p>
            By clicking "I Agree", creating a task, or uploading evidence on Enfora, you ("User," "you," or
            "your") acknowledge that you have read, understood, and agree to be legally bound by this
            Agreement in its entirety.
          </p>

          <p>
            If you do not agree, <strong>do not create a task or submit evidence</strong>.
          </p>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">1. Platform Description and Purpose</h2>
            <p className="mb-4">
              Enfora is a <strong>commitment enforcement platform</strong> designed to increase accountability by
              requiring users to:
            </p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Define a task with a specific description and deadline</li>
              <li>Attach a predefined financial stake</li>
              <li>Submit qualifying evidence of task completion</li>
              <li>Undergo automated and, where applicable, human review of evidence</li>
              <li>Accept penalties if task requirements are not satisfied</li>
            </ul>
            <p className="mt-4">
              Enfora does <strong>not</strong> guarantee productivity outcomes, success, or behavioral improvement. Enfora
              solely enforces the rules defined at task creation and within this Agreement.
            </p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">2. Task Creation and Binding Commitment</h2>

            <h3 className="text-xl font-light mb-3 text-white">2.1 Binding Nature of Tasks</h3>
            <p className="mb-3">When you create a task on Enfora, you acknowledge and agree that:</p>
            <ol className="list-decimal pl-8 space-y-2">
              <li>The task constitutes a binding commitment governed by this Agreement.</li>
              <li>Tasks may not be created for actions completed prior to task creation.</li>
            </ol>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">2.2 Prohibition on Retroactive Tasks</h3>
            <p className="mb-3">
              You explicitly agree not to create tasks for activities already completed, partially completed, or
              staged prior to the task's creation timestamp.
            </p>
            <p>
              Evidence indicating pre-task completion may result in immediate task failure or account
              enforcement action.
            </p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">3. Definition of Task Completion and Task Failure</h2>

            <h3 className="text-xl font-light mb-3 text-white">3.1 Successful Task Completion</h3>
            <p className="mb-3">A task is considered <strong>successfully completed</strong> only if:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Evidence is submitted <strong>before the deadline</strong>, and</li>
              <li>The evidence is <strong>accepted</strong> through AI validation or human review</li>
            </ul>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">3.2 Failed Task (Explicit Definition)</h3>
            <p className="mb-3">
              A task is considered <strong>failed</strong> if <strong>the deadline passes without any accepted evidence</strong>.
            </p>
            <p className="mb-3">This includes, but is not limited to:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>No evidence submitted before the deadline</li>
              <li>Evidence submitted but rejected with no successful appeal</li>
              <li>Invalid, insufficient, manipulated, or fraudulent evidence</li>
            </ul>
            <p className="mt-4">
              Upon failure, the associated financial penalty is applied automatically, subject to Section 7
              (Human Review).
            </p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">4. Evidence Submission Rules</h2>

            <h3 className="text-xl font-light mb-3 text-white">4.1 Permitted Evidence Types</h3>
            <p className="mb-3">Only the following evidence types are permitted:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Images</li>
              <li>Documents</li>
            </ul>
            <p className="mt-3">No other evidence formats are supported or accepted.</p>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">4.2 Accuracy and Authenticity</h3>
            <p className="mb-3">By uploading evidence, you affirm that:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>The evidence directly relates to the specific task</li>
              <li>The evidence was created <strong>after</strong> the task was created</li>
              <li>The evidence accurately reflects genuine task completion</li>
              <li>The evidence has not been reused, altered, staged, falsified, or manipulated</li>
            </ul>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">4.3 Metadata and Integrity Analysis</h3>
            <p className="mb-3">You acknowledge that Enfora may analyze:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>File metadata (including creation and modification timestamps)</li>
              <li>Structural, visual, and textual indicators</li>
              <li>Consistency with the task description and timeline</li>
            </ul>
            <p className="mt-3">Evidence indicating prior creation, reuse, or manipulation may be rejected.</p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">5. Automated AI Evidence Validation</h2>

            <h3 className="text-xl font-light mb-3 text-white">5.1 AI Provider Disclosure</h3>
            <p className="mb-3">
              Automated evidence validation on Enfora is performed using <strong>OpenAI models</strong>.
            </p>
            <p className="mb-3">By uploading evidence, you explicitly consent to:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Your evidence being processed by OpenAI systems</li>
              <li>Compliance with OpenAI's applicable usage terms and policies</li>
            </ul>
            <p className="mt-3">
              Relevant OpenAI policies include, but are not limited to:{' '}
              <a
                href="https://openai.com/policies/usage-policies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                https://openai.com/policies/usage-policies
              </a>
            </p>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">5.2 Nature of AI Decisions</h3>
            <p className="mb-3">You acknowledge that:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>AI validation is probabilistic and non-deterministic</li>
              <li>AI systems evaluate evidence using confidence thresholds, not certainty</li>
              <li>AI decisions may be incorrect</li>
            </ul>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">5.3 AI Validation Outcomes</h3>
            <p className="mb-3">AI validation may result in:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li><strong>Accepted</strong> - Task marked completed</li>
              <li><strong>Rejected</strong> - Evidence deemed insufficient or invalid</li>
            </ul>
            <p className="mt-3">Rejected evidence may be escalated under Section 7.</p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">6. User Right to Human Review</h2>

            <h3 className="text-xl font-light mb-3 text-white">6.1 Right to Request Review</h3>
            <p>
              If AI validation rejects your evidence, you have the <strong>explicit right</strong> to request human review.
            </p>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">6.2 Effect on Deadlines and Charges</h3>
            <p className="mb-3">Once a task enters <strong>human review status</strong>:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>The task deadline is <strong>temporarily suspended</strong></li>
              <li>No penalty or charge will be applied while review is pending</li>
              <li>The task outcome will be determined <strong>solely by human reviewers</strong></li>
            </ul>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">6.3 Finality of Human Review</h3>
            <p>
              Human reviewer decisions are <strong>final, binding, and non-appealable</strong>, except where required by
              applicable law.
            </p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">7. Human Review Consent and Disclosure</h2>
            <p className="mb-3">By creating tasks or uploading evidence on Enfora, you explicitly consent to:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Human reviewers viewing all task details</li>
              <li>Human reviewers accessing uploaded evidence</li>
              <li>Human reviewers evaluating behavioral patterns to detect fraud, abuse, or manipulation</li>
            </ul>
            <p className="mt-3">This access is strictly for enforcement, validation, and fraud prevention purposes.</p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">8. Financial Stakes, Penalties, and Chargebacks</h2>

            <h3 className="text-xl font-light mb-3 text-white">8.1 Authorization to Charge</h3>
            <p className="mb-3">By attaching a financial stake to a task, you authorize Enfora to:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Charge or allocate funds automatically upon task failure</li>
              <li>Process penalties without further approval</li>
            </ul>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">8.2 Non-Refundable Nature</h3>
            <p>
              Penalties resulting from failed tasks are <strong>final and non-refundable</strong>, except where prohibited by
              law.
            </p>

            <h3 className="text-xl font-light mb-3 mt-6 text-white">8.3 Chargebacks and Payment Disputes</h3>
            <p className="mb-3">You agree that:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Initiating a chargeback or payment dispute related to Enfora penalties constitutes a material breach of this Agreement</li>
              <li>Any chargeback will result in <strong>immediate and permanent account suspension</strong></li>
              <li>Permanently suspended accounts forfeit all platform access and privileges</li>
            </ul>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">9. Prohibited Conduct</h2>
            <p className="mb-3">You explicitly agree not to:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Submit pre-created or reused evidence</li>
              <li>Stage or falsify task completion</li>
              <li>Attempt to deceive AI or human reviewers</li>
              <li>Create tasks intended solely to manipulate metrics or scores</li>
              <li>Exploit loopholes or weaknesses in validation systems</li>
            </ul>
            <p className="mt-4">
              Violations may result in task failure, forfeiture of funds, suspension, or permanent account
              termination.
            </p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">10. Metrics, Scores, and Leaderboards</h2>
            <p className="mb-3">All metrics, scores, streaks, and rankings:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Are informational only</li>
              <li>May change due to recalibration or system updates</li>
              <li>Have no monetary value</li>
              <li>Are not guaranteed to be accurate or permanent</li>
            </ul>
            <p className="mt-3">Metrics may not be disputed.</p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">11. No Warranty</h2>
            <p className="mb-3">
              Enfora is provided <strong>"AS IS"</strong> and <strong>"AS AVAILABLE."</strong>
            </p>
            <p className="mb-3">We make no warranties regarding:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Evidence acceptance</li>
              <li>AI or human review accuracy</li>
              <li>Task outcomes</li>
              <li>Financial results</li>
            </ul>
            <p className="mt-3">Use of Enfora is entirely at your own risk.</p>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">12. Limitation of Liability</h2>
            <p className="mb-3">To the maximum extent permitted by law:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Enfora shall not be liable for indirect or consequential damages</li>
              <li>Total liability shall not exceed fees paid in the prior 30 days</li>
            </ul>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">13. Indemnification</h2>
            <p className="mb-3">You agree to indemnify and hold harmless Enfora from claims arising from:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Your tasks</li>
              <li>Your evidence</li>
              <li>Your violations of this Agreement</li>
            </ul>
          </section>

          <section className="pt-8">
            <h2 className="text-2xl font-light mb-4 text-white">14. Governing Law</h2>
            <p>
              This Agreement shall be governed by the laws of the applicable jurisdiction in which Enfora
              operates, without regard to conflict of law principles.
            </p>
          </section>

          <section className="pt-8 pb-12">
            <h2 className="text-2xl font-light mb-4 text-white">15. Acceptance</h2>
            <p className="mb-3">By clicking "I Agree", you confirm that you:</p>
            <ul className="list-disc pl-8 space-y-2">
              <li>Understand Enfora's enforcement mechanics</li>
              <li>Accept the risk of penalties</li>
              <li>Consent to AI and human review</li>
              <li>Are acting in good faith</li>
            </ul>
            <p className="mt-4">
              This action constitutes a <strong>legally binding agreement</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
