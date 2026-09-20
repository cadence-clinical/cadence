import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

// Typeset is a stylesheet, not a component: a `typeset` class on a container styles the plain
// HTML inside it. These stories are its tests. All content is synthetic.
const meta = {
  title: "Primitives/Typeset",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function PatientInformation() {
  return (
    <>
      <h1>Preparing for your clinic visit</h1>
      <p>
        This page explains what to bring and what happens on the day. It is{" "}
        <strong>sample content</strong>, written to show each element Typeset styles. Read{" "}
        <a href="#parking">where to park</a> before you leave home.
      </p>
      <h2>What to bring</h2>
      <ul>
        <li>Your referral letter</li>
        <li>
          A list of your current medicines
          <ul>
            <li>Include anything you buy without a prescription</li>
          </ul>
        </li>
        <li>Glasses or hearing aids, if you use them</li>
      </ul>
      <h2>On the day</h2>
      <ol>
        <li>Check in at the reception desk on Level 2.</li>
        <li>A nurse will see you first, then a doctor.</li>
        <li>
          Ask for a letter for your <abbr title="general practitioner">GP</abbr> before you leave.
        </li>
      </ol>
      <blockquote>
        <p>If you need an interpreter, tell us when you book. There is no charge.</p>
      </blockquote>
      <h3 id="clinic-times">Clinic times</h3>
      {/* A table this wide does not fit a phone, so it scrolls inside its own wrapper. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrolling region has to be focusable to be scrolled from the keyboard */}
      <div className="typeset-scroll" role="region" aria-labelledby="clinic-times" tabIndex={0}>
        <table>
          <caption>Times are for this sample only</caption>
          <thead>
            <tr>
              <th scope="col">Clinic</th>
              <th scope="col">Day</th>
              <th scope="col">First appointment</th>
              <th scope="col">Last appointment</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">General</th>
              <td>Monday</td>
              <td>08:30</td>
              <td>16:00</td>
            </tr>
            <tr>
              <th scope="row">Review</th>
              <td>Thursday</td>
              <td>10:15</td>
              <td>11:45</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h4>Where to go</h4>
      <dl>
        <dt>Entrance</dt>
        <dd>Main building, east door</dd>
        <dt>Clinic</dt>
        <dd>Outpatients, Level 2</dd>
      </dl>
      <h5 id="parking">Parking</h5>
      <p>
        The car park is <del>free</del> <mark>free for the first hour</mark>. Take your ticket to
        reception.
      </p>
      <h6>About this page</h6>
      <p>
        The file is <code>visit.md</code>. Press <kbd>P</kbd> to print it.
      </p>
      <hr />
      <details>
        <summary>Why we ask for a medicines list</summary>
        <p>It helps the team check that nothing you take has been missed.</p>
      </details>
    </>
  );
}

export const Default: Story = {
  render: () => (
    <article className="typeset">
      <PatientInformation />
    </article>
  ),
};

/** Dense: a note or a summary inside a workstation layout. */
export const Compact: Story = {
  render: () => (
    <article className="typeset typeset-compact">
      <PatientInformation />
    </article>
  ),
};

/** Long-form content read by patients and carers. */
export const Reading: Story = {
  render: () => (
    <article className="typeset typeset-reading">
      <PatientInformation />
    </article>
  ),
};

// WCAG 1.4.10 asks for reflow at 320px. Text wraps, and the wide table scrolls inside its wrapper,
// so the page itself never scrolls sideways.
export const FitsAPhone: Story = {
  render: () => (
    <article className="typeset typeset-reading w-80" data-testid="phone">
      <PatientInformation />
    </article>
  ),
  play: async ({ canvasElement }) => {
    const page = within(canvasElement).getByTestId("phone");
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth);

    const region = within(canvasElement).getByRole("region", { name: "Clinic times" });
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    region.focus();
    await expect(region).toHaveFocus();
  },
};

export const PresetsChangeTheSize: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="typeset typeset-compact">Compact text</p>
      <p className="typeset">Default text</p>
      <p className="typeset typeset-reading">Reading text</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const size = (text: string) =>
      parseFloat(getComputedStyle(within(canvasElement).getByText(text)).fontSize);

    await expect(size("Compact text")).toBeLessThan(size("Default text"));
    await expect(size("Default text")).toBeLessThan(size("Reading text"));
  },
};

// Mixed-case (Tall Man) lettering tells look-alike medicine names apart by selective
// capitalisation, so nothing in Typeset may change the case of text. The names are the examples
// in ACSQHC, 'Mixed-case lettering': Principles for application, April 2024.
export const KeepsMixedCaseLettering: Story = {
  render: () => (
    <article className="typeset">
      <h1>oBINUTUZumab</h1>
      <h2>oFATUMumab</h2>
      <h3>proGRAF</h3>
      <h4>proZAC</h4>
      <h5>oBINUTUZumab</h5>
      <h6>oFATUMumab</h6>
      <table>
        <thead>
          <tr>
            <th scope="col">proGRAF</th>
            <th scope="col">proZAC</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sample</td>
            <td>Sample</td>
          </tr>
        </tbody>
      </table>
      <dl>
        <dt>oBINUTUZumab</dt>
        <dd>Sample</dd>
      </dl>
      <details>
        <summary>oFATUMumab</summary>
        <p>Sample</p>
      </details>
    </article>
  ),
  play: async ({ canvasElement }) => {
    const elements = [...canvasElement.querySelectorAll(".typeset, .typeset *")];
    await expect(elements.length).toBeGreaterThan(10);

    for (const element of elements) {
      const style = getComputedStyle(element);
      await expect(style.textTransform, element.tagName).toBe("none");
      await expect(style.fontVariantCaps, element.tagName).toBe("normal");
    }
  },
};

// A small heading over a paragraph and a term over its definition are the same thing to a reader:
// a label above a block. Content arrives marked up either way, so they have to look the same.
export const SmallHeadingsMatchDefinitionTerms: Story = {
  render: () => (
    <article className="typeset grid grid-cols-2 gap-8">
      <div>
        <h4>As headings</h4>
        <h5>Entrance</h5>
        <p>Main building, east door</p>
        <h5>Clinic</h5>
        <p>Outpatients, Level 2</p>
      </div>
      <div>
        <h4 className="mt-0">As a definition list</h4>
        <dl>
          <dt>Entrance</dt>
          <dd>Main building, east door</dd>
          <dt>Clinic</dt>
          <dd>Outpatients, Level 2</dd>
        </dl>
      </div>
    </article>
  ),
  play: async ({ canvasElement }) => {
    const [headings, list] = [...canvasElement.querySelectorAll(".typeset > div")];
    if (!headings || !list) throw new Error("The story needs both columns.");
    const look = (element: Element | null) => {
      if (!element) throw new Error("An element the story needs is missing.");
      const { fontSize, fontWeight, color, lineHeight } = getComputedStyle(element);
      return { fontSize, fontWeight, color, lineHeight };
    };
    // Where each line of text sits, measured from the column's own heading.
    const layout = (column: Element, selector: string) => {
      const origin = column.querySelector("h4")?.getBoundingClientRect().bottom ?? 0;
      return [...column.querySelectorAll(selector)].map((element) =>
        Math.round(element.getBoundingClientRect().top - origin),
      );
    };

    await expect(look(headings.querySelector("h5"))).toEqual(look(list.querySelector("dt")));
    await expect(look(headings.querySelector("p"))).toEqual(look(list.querySelector("dd")));
    await expect(layout(headings, "h5, p")).toEqual(layout(list, "dt, dd"));
  },
};

export const OptsOutWithNotTypeset: Story = {
  render: () => (
    <div className="typeset">
      <ul aria-label="Styled list">
        <li>Styled by Typeset</li>
      </ul>
      <div className="not-typeset">
        <ul aria-label="Untouched list">
          <li>Left alone</li>
        </ul>
      </div>
      <ul data-not-typeset aria-label="Untouched by attribute">
        <li>Left alone</li>
      </ul>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const marker = (name: string) =>
      getComputedStyle(within(canvasElement).getByRole("list", { name })).listStyleType;

    await expect(marker("Styled list")).toBe("disc");
    await expect(marker("Untouched list")).toBe("none");
    await expect(marker("Untouched by attribute")).toBe("none");
  },
};

export const UtilitiesWin: Story = {
  render: () => (
    <div className="typeset">
      <p>First paragraph.</p>
      <p className="mt-0 font-semibold">A paragraph whose utilities override Typeset.</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const paragraph = within(canvasElement).getByText(/utilities override/);
    await expect(getComputedStyle(paragraph).marginTop).toBe("0px");
    await expect(getComputedStyle(paragraph).fontWeight).toBe("600");
  },
};

export const WrapsLongContent: Story = {
  render: () => (
    <div className="typeset w-60 border p-2" data-testid="narrow">
      <p>SYNTHETICIDENTIFIER000000000000000000000000000000000000000000000000000000000000</p>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const container = within(canvasElement).getByTestId("narrow");
    await expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
  },
};

export const LinesUpNumbersInTables: Story = {
  render: () => (
    <div className="typeset">
      <table>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Sample A</th>
            <td>111</td>
          </tr>
          <tr>
            <th scope="row">Sample B</th>
            <td>888</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const table = within(canvasElement).getByRole("table");
    await expect(getComputedStyle(table).fontVariantNumeric).toContain("tabular-nums");
  },
};

const MEASURED = [
  "marginTop",
  "marginBottom",
  "paddingTop",
  "paddingBottom",
  "borderTopWidth",
  "borderBottomWidth",
] as const;

// The contract that makes Typeset safe for content that arrives in pieces: a new block brings its
// own space and never changes a block that is already on screen.
export const AppendingContentRestylesNothing: Story = {
  render: () => (
    <div className="typeset" data-testid="stream">
      <h2>Summary</h2>
      <p>First paragraph.</p>
      <ul>
        <li>First item</li>
      </ul>
      <table>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sample A</td>
            <td>1</td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const container = within(canvasElement).getByTestId("stream");
    const existing = [...container.querySelectorAll("*")];
    const measure = () =>
      existing.map((element) => {
        const style = getComputedStyle(element);
        return MEASURED.map((property) => style[property]).join(" ");
      });

    const before = measure();

    const append = (parent: Element | null, tag: string, text: string) => {
      if (!parent) throw new Error(`Nothing to append a ${tag} to.`);
      const element = document.createElement(tag);
      element.textContent = text;
      parent.append(element);
      return element;
    };
    append(container.querySelector("ul"), "li", "Second item");
    const row = append(container.querySelector("tbody"), "tr", "");
    append(row, "td", "Sample B");
    append(row, "td", "2");
    append(container, "p", "A paragraph that arrived later.");
    append(container, "h2", "A heading that arrived later");

    await expect(measure()).toEqual(before);
  },
};
