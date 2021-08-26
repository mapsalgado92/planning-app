import { Fragment } from 'react';
import Head from 'next/head';
import PageLayout from '../components/layout/PageLayout'

import 'bootstrap/dist/css/bootstrap.css'
import '../styles/global.css'

export default function MyApp(props) {
  const { Component, pageProps } = props;

  return (
    <Fragment>
      <Head>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </Head>
      <PageLayout>
        <Component {...pageProps} />
      </PageLayout>
    </Fragment>
  );
}