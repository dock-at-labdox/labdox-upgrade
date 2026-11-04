import { defineType, defineField } from "sanity";
import {
  DOMAINS,
  ITEM_TYPE_DOMAINS,
  INTENT_TAGS,
  PASSION_THEMES,
  OUTCOME_TAGS,
  AUDIENCES,
} from "../../lib/taxonomy/constants";

const WORKFLOW_STATES = [
  { title: "Draft", value: "draft" },
  { title: "Review", value: "review" },
  { title: "Approved", value: "approved" },
  { title: "Published", value: "published" },
  { title: "Archived", value: "archived" },
];

const JOURNEYS = [
  { title: "Blue", value: "blue" },
  { title: "Red", value: "red" },
  { title: "Home", value: "home" },
];

const PROMPT_KINDS = [
  { title: "Starter chip", value: "starter_chip" },
  { title: "Placeholder", value: "placeholder" },
];

const QUESTION_SLOTS = [
  { title: "Passion probe", value: "passion_probe" },
  { title: "Aspiration probe", value: "aspiration_probe" },
  { title: "Blue clarifier", value: "blue_clarifier" },
];

const TAXONOMY_SLUGS: Set<string> = new Set([
  ...DOMAINS.map((item) => item.slug),
  ...ITEM_TYPE_DOMAINS.map((item) => item.slug),
  ...INTENT_TAGS.map((item) => item.slug),
  ...PASSION_THEMES.map((item) => item.slug),
  ...OUTCOME_TAGS.map((item) => item.slug),
  ...AUDIENCES.map((item) => item.slug),
]);

const validateTaxonomyMapping = (value: string | undefined) =>
  !value || TAXONOMY_SLUGS.has(value)
    ? true
    : "Select a valid taxonomy slug from the approved vocabulary.";

const workflowStatusField = () =>
  defineField({
    name: "status",
    title: "Workflow status",
    type: "string",
    options: { list: WORKFLOW_STATES },
    initialValue: "draft",
    validation: (rule) => rule.required(),
  });

export const globalSettings = defineType({
  name: "globalSettings",
  title: "Global Settings",
  type: "document",
  fields: [
    defineField({
      name: "microcopy",
      title: "Microcopy",
      type: "object",
      fields: [
        defineField({
          name: "home",
          type: "object",
          fields: [
            defineField({ name: "headline", type: "string" }),
            defineField({
              name: "red",
              type: "object",
              fields: [
                defineField({ name: "label", type: "string" }),
                defineField({ name: "sub", type: "string" }),
              ],
            }),
            defineField({
              name: "blue",
              type: "object",
              fields: [
                defineField({ name: "label", type: "string" }),
                defineField({ name: "sub", type: "string" }),
              ],
            }),
          ],
        }),
        defineField({
          name: "blue",
          type: "object",
          fields: [
            defineField({ name: "prompt", type: "string" }),
          ],
        }),
        defineField({
          name: "red",
          type: "object",
          fields: [
            defineField({ name: "prompt", type: "string" }),
          ],
        }),
        defineField({
          name: "switch",
          type: "object",
          fields: [
            defineField({ name: "toRed", type: "string" }),
            defineField({ name: "toBlue", type: "string" }),
          ],
        }),
        defineField({
          name: "continueWhereLeftOff",
          type: "string",
        }),
      ],
    }),
    workflowStatusField(),
  ],
});

export const intentPrompt = defineType({
  name: "intentPrompt",
  title: "Intent Prompt",
  type: "document",
  fields: [
    defineField({
      name: "id",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "journey",
      type: "string",
      options: { list: JOURNEYS },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "kind",
      type: "string",
      options: { list: PROMPT_KINDS },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      validation: (rule) => rule.required().max(48),
    }),
    defineField({
      name: "mapsTo",
      type: "string",
      validation: (rule) =>
        rule.custom((value) => validateTaxonomyMapping(value)),
    }),
    defineField({
      name: "priority",
      type: "number",
      initialValue: 0,
      validation: (rule) => rule.integer().min(0),
    }),
    workflowStatusField(),
  ],
});

export const questionBank = defineType({
  name: "questionBank",
  title: "Question Bank",
  type: "document",
  fields: [
    defineField({
      name: "id",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slot",
      type: "string",
      options: { list: QUESTION_SLOTS },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "selectionKeys",
      type: "object",
      fields: [
        defineField({ name: "persona", type: "string" }),
        defineField({ name: "goal", type: "string" }),
        defineField({ name: "intentTag", type: "string" }),
        defineField({ name: "domain", type: "string" }),
      ],
    }),
    defineField({
      name: "questionText",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "options",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "label",
              type: "string",
              validation: (rule) => rule.required(),
            }),
            defineField({ name: "icon", type: "image" }),
            defineField({
              name: "mapsTo",
              type: "string",
              validation: (rule) =>
                rule.required().custom((value) =>
                  typeof value === "string" && TAXONOMY_SLUGS.has(value)
                    ? true
                    : "Select a valid taxonomy slug from the approved vocabulary.",
                ),
            }),
          ],
        },
      ],
      validation: (rule) => rule.required().min(3).max(6),
    }),
    workflowStatusField(),
  ],
});
