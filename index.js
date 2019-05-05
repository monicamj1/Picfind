

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

import {
    createStackNavigator,
    createAppContainer
} from 'react-navigation';

import Home from './Home';
import Results from './Results';

const navigator = createStackNavigator({
    home: Home,
    results: Results,
    
});



const app = createAppContainer(navigator);


AppRegistry.registerComponent(appName, () => app);
