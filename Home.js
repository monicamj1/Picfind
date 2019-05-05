
import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, FlatList, Image, TouchableHighlight, Button, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { whileStatement } from '@babel/types';
import Dialog, {
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogButton,
  SlideAnimation,
  ScaleAnimation,
} from 'react-native-popup-dialog';
import ImagePicker from 'react-native-image-picker';

/*
COSAS IMPORTANTES: Necesitamos un modo de elegir un directorio del móvil y guardar el path. De momento hay que seguir buscando porque 
no hemos encontrado cómo.
Necesitamos convertir imágenes a base64 para poder trabajar prácticamente con todo. No funciona con imágenes de las propias carpetas de React, sólo del dispositivo.
No conseguimos acceder a grupos de imágenes del dispositivo.
El fs podremos usarlo tras resolver lo anterior.
*/

const imagePickerOptions = {
  title: 'Selecciona una carpeta'
}


export default class Home extends Component {
  state = {
    filters: [
      { id: 0, name: "Caras", selected: true },
      { id: 1, name: "Borrosas", selected: true },
    ],
    folders: [
      { id: 0, name: "Todas las carpetas", selected: true },
      { id: 1, name: "ReactImg", selected: true },
      // { id: 1, name: "Cámara", selected: true },
      // { id: 2, name: "Twitter", selected: true },

    ],
    folder: [{ id: null, name: null }],
    options: [{ filt: null, folder: null }],
    defaultAnimationDialog: false,
  }

  //BARRA DE NAVEGACIÓN SUPERIOR
  static navigationOptions = {
    title: 'Picfind',
    headerTitleStyle: {
      textAlign: "center",
      flex: 1,
      marginTop: -50,
    },
    headerTintColor: 'white',
    headerStyle: {
      backgroundColor: '#45D9B4',
      elevation: 0,
      height: 100,
    },
  };



  //IMPRIME LISTA DE CARPETAS EN EL DIALOG
  renderItemFolders = ({ item }) => (
    <TouchableOpacity style={styles.itemFolder}
      activeOpacity={0.2}
      onPress={this.changeSelectedFolder(item.id)}
    >
      <Image source={require('./assets/icono_carpeta.png')} style={styles.itemPic} />
      <Text style={styles.itemName}>{item.name}</Text>
    </TouchableOpacity>
  )

  //TODO: Elegir un directorio de los que ya hay en el dispositivo y guardar el path del mismo
  /*
  openPopUp = () => {
    ImagePicker.showImagePicker(imagePickerOptions, (response) => {
      console.log('Response = ', response);
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton);
      } else {
        const source = { uri: response.uri }
      }
    });
}
*/
  
    //ABRIR DIALOG
    openPopUp = () => {
      this.setState({
        defaultAnimationDialog: true,
      });
    }
  

  /*Directory picker NO FUNCIONA, PERO ALGO ASÍ
  openPopUp = () => {
    DirectoryPickerManager.showDirectoryPicker(null, (response) => {
      console.log('Response = ', response);
      alert(response.path);
    
      if (response.didCancel) {
        console.log('User cancelled directory picker');
      }
      else if (response.error) {
        console.log('DirectoryPickerManager Error: ', response.error);
      }
    });
  }*/


  //SELECCIONAR CARPETA (SIMULADO)
  changeSelectedFolder = (id) => () => {
    this.setState({ defaultAnimationDialog: false });
    this.state.folder.id = id;
    this.state.folder.name = this.state.folders[id].name;
    this.state.options.folder = id;
  }



  //IMPRIME LISTA DE FILTROS
  renderItemFilter = ({ item }) => (
    <TouchableOpacity style={(item.selected ? styles.item : styles.itemSelected)}
      activeOpacity={0.2}
      onPress={this.changeSelected(item.id)}
    >
      <Image source={(item.selected ? require('./assets/icono_filtro.png') : require('./assets/icono_filtro_sel.png'))} style={styles.itemPic} />
      <Text style={(item.selected ? styles.itemName : styles.itemNameSelected)}>{item.name}</Text>
    </TouchableOpacity>
  )



  //SELECCIONAR FILTRO
  changeSelected = (id) => () => {
    this.setState(prevState => ({
      filters: prevState.filters.map((filter, i) => (i === id
        ? { ...filter, selected: !filter.selected }
        : { ...filter, selected: true }))
    }));
    this.state.options.filt = id;
  }



  //ONCLICK DEL BOTÓN DE BUSCAR
  clickBtn = (options) => {
    const { navigation } = this.props;
    let selectedFilter = options.filt;
    let selectedFolder = options.folder;
    navigation.navigate(
      'results',
      { filter: selectedFilter },
      { folder: selectedFolder }
    );

  }


  //MOSTRAR BUTTON DE BUSCAR SI SE CUMPLEN LAS CONDICIONES
  showBtn = () => {
    if (this.state.options.filt != null && this.state.options.folder != null) {
      return <View style={styles.searchBtn}>
        <Button
          title="Buscar"
          onPress={() => this.clickBtn(this.state.options)}
          color="#F05576"
        />
      </View>
    }
  }


  render() {
    return (

      <View style={styles.container}>

        <View style={styles.listContainer} >
          <View style={styles.title}>
            <Text style={styles.titleText}>CARPETAS</Text>
          </View>
          <TouchableOpacity style={styles.item}
            activeOpacity={0.2}
            onPress={this.openPopUp}
          >
            <Image source={require('./assets/icono_carpeta.png')} style={styles.itemPic} />
            <Text style={styles.itemName}>{(this.state.folder.name == null ? 'Seleccionar carpeta' : this.state.folder.name)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listContainer} >
          <View style={styles.title}>
            <Text style={styles.titleText}>FILTROS</Text>
          </View>
          <FlatList data={this.state.filters}
            renderItem={this.renderItemFilter}
            keyExtractor={(item) => item.id.toString()}
          ></FlatList>
        </View>

        {this.showBtn()}

        <Dialog
          onDismiss={() => {
            this.setState({ defaultAnimationDialog: false });
          }}
          width={0.8}
          height={0.5}
          rounded
          visible={this.state.defaultAnimationDialog}
          dialogStyle={{
            padding: 0,
            margin: 0,
          }}
        >

          <DialogContent>
            <ScrollView>
              <FlatList data={this.state.folders}
                renderItem={this.renderItemFolders}
                keyExtractor={(item) => item.id.toString()}
              ></FlatList>
            </ScrollView>
          </DialogContent>

        </Dialog>

      </View>

    );
  }
}



const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    elevation: 1,
    marginTop: -70,
  },

  listContainer: {
    width: '90%',
    marginLeft: '5%',
    marginRight: '5%',
    marginTop: 20,
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
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderBottomWidth: 0.3,
    borderColor: '#e0e0e0',
    height: 50,
  },
  itemName: {
    marginLeft: 15,
  },
  itemPic: {
    height: 30,
    width: 30,
    borderRadius: 30,
    marginLeft: 5,
  },
  itemSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderBottomWidth: 0.3,
    backgroundColor: '#F05576',
    borderColor: '#e0e0e0',
    height: 50,
  },
  itemNameSelected: {
    marginLeft: 15,
    color: 'white',
    fontWeight: 'bold',
  },
  itemFolder: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.3,
    borderColor: '#e0e0e0',
    height: 50,
  },
  searchBtn: {
    marginTop: 40,
    marginLeft: '15%',
    marginRight: '15%',
  },


});
