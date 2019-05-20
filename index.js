import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import {
    createStackNavigator,
    createAppContainer
} from 'react-navigation';
import Home from './Home';

const navigator = createStackNavigator({
    home: Home,    
});

const app = createAppContainer(navigator);

AppRegistry.registerComponent(appName, () => app);
