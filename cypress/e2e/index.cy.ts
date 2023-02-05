it(`testing`, () => {
  cy.visit(`/`, { headers: { 'Accept-Encoding': `gzip, deflate` } })

  expect(true).to.equal(true)
})
