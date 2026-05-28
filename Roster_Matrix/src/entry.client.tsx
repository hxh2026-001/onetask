import { render, clientLoader } from '@builder.io/qwik'
import Root from './root'

clientLoader()

render(document, <Root />)