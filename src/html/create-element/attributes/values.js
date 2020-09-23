const attributeValueTypes = new Set([`string`, `number`, `boolean`])

export const isAttributeValue = value =>
  value == null || attributeValueTypes.has(typeof value)
