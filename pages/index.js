import Head from 'next/head'
import { connectToDatabase } from '../lib/mongodb'

export default function Home({ isConnected, projects, languages, weeks, lobs }) {
  return (
    <>
      <Head>
        <title>Planning Tool</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">
          This is the Planning Tool Skeleton
        </h1>

        {isConnected ? (
          <h2 className="subtitle">You are connected to MongoDB</h2>
        ) : (
          <h2 className="subtitle">
            You are NOT connected to MongoDB.
          </h2>
        )}

        <h2>Projects</h2>
        {
          projects && projects.map(project => <h3 key={project._id}>{project.name} - {project._id}</h3>)
        }

        <h2>Languages</h2>
        {
          languages && languages.map(language => <h3 key={language._id}>{language.name} - {language._id}</h3>)
        }

        <h2>LOBs</h2>
        {
          lobs && lobs.map(lob => <h3 key={lob._id}>{lob.name} - {lob._id}</h3>)
        }

        <h2>Weeks</h2>
        {
          weeks && weeks.map(week => <h3 key={week._id}>{week.code} - {week._id}</h3>)
        }
        <br />
        <button onClick={async () => {
          const res = fetch("/api/projects",
            {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                item:
                {
                  name: "Ecolab",
                  _id: "60f9f24fc1668d3236ad1a97"
                }
              })

            })
          return res
        }}>Test Button</button>

      </main>

      <footer>
        An app by Mario Salgado
      </footer>
    </>
  )
}

export async function getServerSideProps() {
  const { client, db } = await connectToDatabase()

  const isConnected = await client.isConnected()

  const projects = await db.collection("projects").find({}).toArray()
  const languages = await db.collection("languages").find({}).toArray()
  const lobs = await db.collection("lobs").find({}).toArray()
  const weeks = await db.collection("weeks").find({}).toArray()

  const props = { isConnected, projects, languages, lobs, weeks }

  return {
    props: JSON.parse(JSON.stringify(props))
  }
}
