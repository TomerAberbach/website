import test from 'ava'
import traverse from 'html/traverse'

test(`traverse concrete example`, t => {
  let count = 0

  traverse(
    <body>
      <h1>Hello World!</h1>
      <article>
        <h2>The best article</h2>
        <p>
          In the
          {` `}
          <b>beginning</b>
          , there was HTML!
        </p>
      </article>
    </body>,
    () => count++
  )

  t.is(count, 6)
})
