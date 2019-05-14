import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, FlatList, Image, TouchableHighlight, Button, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Dialog, {
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogButton,
  SlideAnimation,
  ScaleAnimation,
} from 'react-native-popup-dialog';
import RNFS from 'react-native-fs';
import DirectoryPickerManager from 'react-native-directory-picker';
import Results from './Results.js'
import Clarifai from 'clarifai';
import AsyncStorage from '@react-native-community/async-storage';

const app = new Clarifai.App({
  apiKey: '73cdb62bd9594690acc4626aa080c1f0'
});




export default class Home extends Component {
  state = {
    filterList: [
      { id: 0, name: "Caras", results: 28, selected: true },
      { id: 1, name: "Borrosas", results: 13, selected: true },
    ],
    folderName: null,
    selectedFolder: null,
    selectedFilter: null,
    showFilters: false,
    showPics: false,
    analysis: 100,
    imgList: [],
    imgResults: [],
    savedData: [],
  }



  ///////////////////////////////////////////////////////////////////////////////////////// BARRA DE NAVEGACIÓN SUPERIOR
  static navigationOptions = {
    title: 'Picfind',
    headerTitleStyle: {
      textAlign: "center",
      flex: 1,
    },
    headerTintColor: 'white',
    headerStyle: {
      backgroundColor: '#45D9B4',
      elevation: 2,
    },
  };



  //////////////////////////////////////////////////////////////////////////////////////// DIRECTORY PICKER
  selectFolder = () => {
    DirectoryPickerManager.showDirectoryPicker(null, (response) => {
      if (response.didCancel) {
        console.log('User cancelled directory picker');
      }
      else if (response.error) {
        console.log('DirectoryPickerManager Error: ', response.error);
      }
      else {
        // console.log('Response = ', response);
        this.setState({
          selectedFolder: response.path,
          folderName: response.dirname,
          showFilters: true,
        });
        this.saveAllImages();
      }
    });
  }


  //////////////////////////////////////////////////////////////////////////////////////// GUARDAR TODAS LAS IMÁGENES EN ARRAY
  saveAllImages = () => {
    RNFS.readDir(this.state.selectedFolder)
      .then((ficheros) => {
        if (ficheros.length > 0) {
          let imgList = [];
          for (let i = 0; i < ficheros.length; i++) {
            imgList.push(ficheros[i].path);
          }
          this.setState({ imgList });
          this.loadList();
        }
      });

  }



  //////////////////////////////////////////////////////////////////////////////////////// GUARDAR DATOS
  async saveList(data) {
    try {
      await AsyncStorage.setItem('data', JSON.stringify(data));
    } catch (e) {
      alert(e);
    }
  }



  //////////////////////////////////////////////////////////////////////////////////////// CARGAR DATOS
  async loadList() {
    const data = await AsyncStorage.getItem('data');
    const json = await JSON.parse(data);
    if (data) {
      this.setState({ savedData: json });
      console.log('Ya hay datos guardados', this.state.savedData);
    } else {
      console.log('No hay datos');
    }

    this.checkIfImgExist(this.state.imgList);
  }



  //////////////////////////////////////////////////////////////////////////////////////// GUARDAR LAS IMÁGENES NUEVAS
  checkIfImgExist = (imgList) => {
    const newImg = imgList;
    if (this.state.savedData != null) {
      for (let i = 0; i < imgList.length; i++) {
        for (let j = 0; j < this.state.savedData.length; j++) {
          if (imgList[i] == this.state.savedData[j].path) {
            //newImg = imgList.filter(img => img != this.state.savedData[j].path);
            newImg.splice(i, 1);
          } else {
            console.log('la imagen ya está en la bbdd');
          }
        }
      }
    }
    if(newImg.length != 0){
      this.callClarifai(newImg);
      console.log('Nuevas imágenes', newImg);
    }else{
      console.log('No hay imágenes nuevas a enviar')
    }
  }



  imgBase64 = (img) => {
    RNFS.readFile(img, 'base64').then((content) => {
      return content;
    })
  }


  //////////////////////////////////////////////////////////////////////////////////////// CLARIFAI
  callClarifai = (img) => {
    const data = this.state.savedData;
    for (let i = 0; i < img.length; i++) {
      RNFS.readFile(img[i], 'base64').then(base64 => {
        app.models.predict(Clarifai.FACE_DETECT_MODEL, { base64 })
          .then(res => {
            if (res.outputs) {
              data.push({ 'path': img[i], 'clarifai': res.outputs });
              this.saveList(data);
              console.log('Clarifai resp', data);
            }
            else {

            }
          })
          //error de la API 
          .catch(error => {
            Alert.alert('error', JSON.stringify(error));
          })
      })

    }
    //TODO: llamar a la función cuando se hayan acabado las llamadas a Clarifai
  
  }




  //////////////////////////////////////////////////////////////////////////////////////// IMPRIME LISTA DE FILTROS
  renderItemFilter = ({ item }) => (
    <TouchableOpacity style={(item.selected ? styles.item : styles.itemSelected)}
      activeOpacity={0.2}
      onPress={this.changeSelected(item.id)}
    >
      <Image source={(item.selected ? require('./assets/icono_filtro.png') : require('./assets/icono_filtro_sel.png'))} style={styles.itemPic} />
      <Text style={(item.selected ? styles.itemName : styles.itemNameSelected)}>{item.name}</Text>
      {this.showProgressFilterFeedback(item.id)}
    </TouchableOpacity>
  )



  //////////////////////////////////////////////////////////////////////////////////////// SELECCIONAR FILTRO
  changeSelected = (id) => () => {
    this.setState(prevState => ({
      filterList: prevState.filterList.map((filter, i) => (i === id
        ? { ...filter, selected: !filter.selected }
        : { ...filter, selected: true })),
      selectedFilter: id,
    }));
  }



  //////////////////////////////////////////////////////////////////////////////////////// ONCLICK DEL BOTÓN DE MOSTRAR RESULTADOS
  clickBtn = () => {
    alert('llevar a resultados');
    this.setState({
      showPics: true
    })
    //TODO: Scroll a los resultados
  }



  //////////////////////////////////////////////////////////////////////////////////////// CAMBIO DE MENSAJE DEL BOTÓN SEGÚN EL ESTADO
  showBtn = () => {
    let btnContent = 'Mostrar resultados';
    let dis = false;
    if (this.state.selectedFolder == null) {
      btnContent = 'Selecciona carpeta';
      dis = true;
    }
    else {
      if (this.state.analysis < 100) {
        btnContent = 'Espere al análisis';
        dis = true;
      } else {
        if (this.state.selectedFilter == null) {
          btnContent = 'Selecciona un filtro';
          dis = true;
        } else {
        }
      }
    }
    return <View style={styles.searchBtn}>
      <Button
        title={btnContent}
        onPress={() => this.clickBtn()}
        color="#F05576"
        disabled={dis}
      />
    </View>
  }



  //////////////////////////////////////////////////////////////////////////////////////// RENDERIZAR COMPONENTE CON LOS RESULTADOS
  showResults = () => {
    if (this.state.showPics == true) {
      return <Results />
    }
  }



  //////////////////////////////////////////////////////////////////////////////////////// LISTA DE FILTROS
  showFilters = () => {
    if (this.state.showFilters == true) {
      return <View style={styles.listContainer} >
        <View style={styles.title}>
          <Text style={styles.titleText}>FILTROS</Text>
        </View>
        <FlatList data={this.state.filterList}
          renderItem={this.renderItemFilter}
          keyExtractor={(item) => item.id.toString()}
        ></FlatList>
      </View>
    }
  }



  //////////////////////////////////////////////////////////////////////////////////////// PROGRESO DE LOS RESULTADOS PARA CADA FILTRO
  showProgressFilterFeedback = (id) => {
    return <Text style={styles.filterProgress}>{this.state.filterList[id].results}</Text>;
  }



  ///////////////////////////////////////////////////////////////////////////////////// PROGRESO DEL ANÁLISIS DE LA CARPETA
  showProgressFolderFeedback = () => {
    if (this.state.selectedFolder != null) {
      if (this.state.analysis == 100) {
        return <Text style={[styles.progress, styles.progressCompleted]}>Analizado</Text>;
      } else {
        return <Text style={styles.progress}>Analizando {this.state.analysis}%</Text>;
      }
    }
  }



  //////////////////////////////////////////////////////////////////////////////////////// RENDER DEL COMPONENTE
  render() {
    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.listContainer} >
            <View style={styles.title}>
              <Text style={styles.titleText}>CARPETAS</Text>
            </View>
            <TouchableOpacity style={styles.item}
              activeOpacity={0.2}
              onPress={this.selectFolder} >
              <Image source={require('./assets/icono_carpeta.png')} style={styles.itemPic} />
              <Text style={styles.itemName}>{(this.state.folderName == null ? 'Seleccionar carpeta' : this.state.folderName)}</Text>
              {this.showProgressFolderFeedback()}
            </TouchableOpacity>
          </View>
          {this.showFilters()}
          {this.showBtn()}
          {this.showResults()}
        </ScrollView>
      </View>

    );
  }
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
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
    width: '100%',
  },
  progress: {
    textAlign: 'right',
    padding: 3,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 20,
    backgroundColor: '#F05576',
    color: 'white',
    fontSize: 10,
    marginLeft: '-40%'
  },
  progressCompleted: {
    backgroundColor: '#009e7f'
  },
  filterProgress: {
    textAlign: 'right',
    padding: 3,
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    fontSize: 10,
    marginLeft: '-25%'
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
    width: '100%'
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
    width: '100%'
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
    marginBottom: 40,
  },
});
