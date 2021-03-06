import { StyleSheet, Dimensions } from 'react-native';

export default StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      backgroundColor: '#F5FCFF',
    },
    folderContainer: {
      marginTop: 20,
    },
    listContainer: {
      width: '90%',
      marginLeft: '5%',
      marginRight: '5%',
      marginBottom: 20,
      borderLeftWidth: 0.3,
      borderRightWidth: 0.3,
      borderTopWidth: 0.3,
      backgroundColor: 'white',
      borderColor: '#e0e0e0',
      borderRadius: 2,
      elevation: 2,
    },
    title: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      borderBottomWidth: 0.3,
      borderColor: '#e0e0e0',
      height: 30,
    },
    titleText: {
      marginLeft: 5,
      fontWeight: 'bold',
      fontSize: 10,
      width: '100%',
    },
    progress: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      textAlign: 'right',
      padding: 3,
      paddingLeft: 5,
      paddingRight: 5,
      borderRadius: 20,
      backgroundColor: '#F05576',
      color: 'white',
      fontSize: 10,
    },
    progressCompleted: {
      backgroundColor: '#009e7f',
    },
    filterProgress: {
      textAlign: 'right',
      padding: 3,
      paddingLeft: 5,
      paddingRight: 5,
      borderRadius: 20,
      backgroundColor: '#e0e0e0',
      fontSize: 10,
      alignItems: 'flex-end',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      borderBottomWidth: 0.3,
      borderColor: '#e0e0e0',
      height: 50,
      paddingRight: 10,
    },
    itemName: {
      marginLeft: 15,
      flex: 1,
      alignItems: 'flex-start',
    },
    itemPic: {
      height: 30,
      width: 30,
      borderRadius: 30,
      marginLeft: 5,
      alignItems: 'flex-start',
    },
    itemSelected: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      borderBottomWidth: 0.3,
      backgroundColor: '#F05576',
      borderColor: '#e0e0e0',
      height: 50,
      paddingRight: 10,
    },
    itemNameSelected: {
      marginLeft: 15,
      color: 'white',
      fontWeight: 'bold',
      width: '100%',
      flex: 1,
      alignItems: 'flex-start',
    },
    itemFolder: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 0.3,
      borderColor: '#e0e0e0',
      height: 50,
    },
    rcontainer: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      backgroundColor: '#F5FCFF',
      elevation: 2,
    },
    rtitle: {
      height: 30,
      borderColor: '#e0e0e0',
      borderBottomWidth: 0.3,
      backgroundColor: 'white',
      alignItems: 'center',
      padding: 5,
      flexDirection: 'row',
    },
    rtitleText: {
      marginLeft: 5,
      fontWeight: 'bold',
      fontSize: 10,
      marginLeft: '5%',
    },
    image: {
      margin: 1,
    },
    img: {
      width: Dimensions.get('window').width / 4,
      height: '100%',
      aspectRatio: 1,
    },
    selectedImage: {
      width: '100%',
      height: '100%',
      aspectRatio: 1,
      opacity: 0.6,
    },
    tools: {
      position: 'absolute',
      flex: 1,
      flexDirection: 'row',
      top: '100%',
      height: 60,
      width: '100%',
      marginTop: -60,
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: '#ffffff99',
      padding: 5,
    },
    optionButtons: {
      opacity: 1,
      margin: 5,
      borderRadius: 50,
      width: 45,
      height: 45,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
    },
    pink: {
      backgroundColor: '#F05576',
    },
    yellow: {
      backgroundColor: '#fcd16e',
    },
    icons: {
      fontSize: 24,
      marginRight: 1,
    },
    instructions: {
      marginTop: 20,
      marginBottom: 20,
    },
  });