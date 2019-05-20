import React, { Component } from 'react';
import { StyleSheet, Text, View, FlatList, Image, ScrollView, ToastAndroid, Dimensions } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Dialog, { DialogContent, DialogFooter, DialogButton } from 'react-native-popup-dialog';
import RNFS from 'react-native-fs';
import DirectoryPickerManager from 'react-native-directory-picker';
import Clarifai from 'clarifai';
import AsyncStorage from '@react-native-community/async-storage';
import GridList from 'react-native-grid-list';
import Icon from 'react-native-vector-icons/FontAwesome';
import { produce } from 'immer';
import styles from './Styles.js';

const app = new Clarifai.App({
  apiKey: '73cdb62bd9594690acc4626aa080c1f0'
});

export default class Home extends Component {
  state = {
    filterList: [
      { id: 0, name: "Todas", results: 0, selected: false },
      { id: 1, name: "Caras", results: 0, selected: false },
      { id: 2, name: "Sin clasificar", results: 0, selected: false },
    ],
    folderName: null,
    selectedFolder: null,
    selectedFilter: null,
    showFilters: false,
    showPics: false,
    analysis: 0,
    imgList: [],
    imgResults: [],
    savedData: [],
    defaultAnimationDialog: false,
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
        if (response.path == null) {
          ToastAndroid.show('¡Sólo carpetas del almacenamiento interno!', ToastAndroid.SHORT);
        } else {
          this.setState({
            selectedFolder: response.path,
            folderName: response.dirname,
            showFilters: true,
            analysis: 0,
            showPics: false,
            imgResults: []
          });
          this.saveAllImages();
        }
      }
    });
  }

  //////////////////////////////////////////////////////////////////////////////////////// GUARDAR TODAS LAS IMÁGENES EN ARRAY
  saveAllImages = () => {
    RNFS.readDir(this.state.selectedFolder)
      .then((ficheros) => {
        if (ficheros.length > 0) {
          let imgList = [];
          console.log('Lista de ficheros del directorio', ficheros);
          for (let i = 0; i < ficheros.length; i++) {
            imgList.push(ficheros[i].path);
          }
          this.setState({ imgList });
          this.loadList(0);
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
    this.loadList(1);
  }

  //////////////////////////////////////////////////////////////////////////////////////// CARGAR DATOS
  async loadList(b) {
    const data = await AsyncStorage.getItem('data');
    const json = await JSON.parse(data);
    if (data) {
      this.setState({ savedData: json });
      console.log('SÍ hay datos guardados', this.state.savedData);
    } else {
      console.log('NO hay datos guardados');
    }
    if (b === 0) {
      this.checkIfImgExist();
    } else if (b === 1) {
      this.countItems();
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////// GUARDAR LAS IMÁGENES NUEVAS
  checkIfImgExist = () => {
    let { imgList: newImg } = this.state;
    if (this.state.savedData != null) {
      newImg = newImg.filter(img => {
        for (let j = 0; j < this.state.savedData.length; j++) {
          if (img === this.state.savedData[j].path) {
            return false;
          }
        }
        return true;
      })
    }
    if (newImg.length > 0) {
      this.callClarifai(newImg);
      console.log('Nuevas imágenes para analizar', newImg);
    } else {
      console.log('No hay imágenes nuevas para analizar');
      this.setState({
        analysis: 100,
      });
      this.loadList(1);
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////// CLARIFAI
  callClarifai = (img) => {
    const data = this.state.savedData;
    let p = 0;
    for (let i = 0; i < img.length; i++) {
      RNFS.readFile(img[i], 'base64').then(base64 => {
        app.models.predict(Clarifai.FACE_DETECT_MODEL, { base64 })
          .then(res => {
            if (res.outputs) {
              data.push({ 'path': img[i], 'clarifai': res.outputs });
              this.saveList(data);
              console.log('Respuesta Clarifai', data);
              p++;
              this.setState({
                analysis: Math.floor(Number((100 * p) / (img.length))),
              });
            }
            else {
              console.log("No hay outputs para :", img[i]);
            }
          })
          .catch(error => {
            Alert.alert('error', JSON.stringify(error));
          })
      })
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////// CONTADOR PARA CADA FILTRO
  countItems = () => {
    let images = [];
    images = this.state.imgList.filter(img => {
      for (let j = 0; j < this.state.savedData.length; j++) {
        if (img === this.state.savedData[j].path) {
          if (this.state.savedData[j].clarifai[0].data.regions !== undefined) { //Si no es nada  
            return true;
          }
        }
      }
      return false;
    })
    this.setState(produce(draft => {
      draft.filterList.forEach(filtro => {
        if (filtro.id === 0) {
          filtro.results = this.state.imgList.length;
        }
        if (filtro.id === 1) {
          filtro.results = images.length;
        }
        if (filtro.id === 2) {
          filtro.results = this.state.imgList.length - images.length;
        }
      })
    }));
  }

  //////////////////////////////////////////////////////////////////////////////////////// IMPRIME LISTA DE FILTROS
  renderItemFilter = ({ item }) => (
    <TouchableOpacity style={(item.selected ? styles.itemSelected : styles.item)}
      activeOpacity={0.2}
      onPress={this.changeSelected(item.id)} >
      <Image source={(item.selected ? require('./assets/icono_filtro_sel.png') : require('./assets/icono_filtro.png'))} style={styles.itemPic} />
      <Text style={(item.selected ? styles.itemNameSelected : styles.itemName)}>{item.name}</Text>
      <Text style={styles.filterProgress}>{item.results}</Text>
    </TouchableOpacity>
  )

  //////////////////////////////////////////////////////////////////////////////////////// SELECCIONAR FILTRO
  changeSelected = (id) => () => {
    this.setState(prevState => ({
      filterList: prevState.filterList.map((filter, i) => (i === id
        ? { ...filter, selected: !filter.selected }
        : { ...filter, selected: false })),
      selectedFilter: id,
    }))
    this.setResults(id);
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

  //////////////////////////////////////////////////////////////////////////////////////// SE MUESTRAN LAS IMÁGENES SEGÚN EL FILTRO
  setResults = (id) => {
    if (this.state.analysis === 100 && id !== null) {
      this.setState({
        showPics: false,
        imgResults: [],
      })
      let images = [];
      switch (id) {
        case 0: //Todas
          this.state.imgList.forEach(img => {
            images.push({ id: img, src: img, selected: false });
          })
          break;
        case 1: //Caras
          this.state.imgList.forEach(img => {
            for (let j = 0; j < this.state.savedData.length; j++) {
              if (img === this.state.savedData[j].path) {
                if (this.state.savedData[j].clarifai[0].data.regions !== undefined) { //Si es cara  
                  images.push({ id: img, src: img, selected: false });
                }
              }
            }
          })
          break;
        case 2: //El resto
          this.state.imgList.forEach(img => {
            for (let j = 0; j < this.state.savedData.length; j++) {
              if (img === this.state.savedData[j].path) {
                if (this.state.savedData[j].clarifai[0].data.regions === undefined) { //Si NO cara  
                  images.push({ id: img, src: img, selected: false });
                }
              }
            }
          })
          break;
      }
      if (images.length > 0) {
        this.setState({
          showPics: true,
          imgResults: images,
        })
      }
      else { ToastAndroid.show('No hay resultados para mostrar.', ToastAndroid.SHORT); }
    }
    else { ToastAndroid.show('Espere al análisis.', ToastAndroid.SHORT); }
  }

  //////////////////////////////////////////////////////////////////////////////////////// RENDERIZAR COMPONENTE CON LOS RESULTADOS
  showResults = () => {
    if (this.state.showPics == true) {
      return (
        <View style={styles.rcontainer} id='resultsContainer'>
          <View style={styles.rtitle}>
            <Text style={styles.rtitleText}>RESULTADOS</Text>
          </View>
          <GridList data={this.state.imgResults}
            numColumns={4}
            renderItem={this.renderItemImg}
            keyExtractor={(item) => item.id} />
          {this.showDialog()}
        </View>
      );
    }
  }

  //////////////////////////////////////////////////////////////////////////////////////// DIALOG DE CANCELAR
  showDialog = () => {
    return (
      <Dialog
        onDismiss={() => {
          this.setState({ defaultAnimationDialog: false });
        }}
        width={0.9}
        visible={this.state.defaultAnimationDialog}
        rounded
        actionsBordered
        actionContainerStyle={{
          flexDirection: 'column',
          backgroundColor: '#ccf7ee',
        }}
        footer={
          <DialogFooter style={styles.btnDialog}>
            <DialogButton
              text="Cancelar"
              bordered
              onPress={() => {
                this.setState({ defaultAnimationDialog: false });
              }}
              key="button-1"
              textStyle={{
                fontSize: 18,
                color: '#515151'
              }} />
            <DialogButton
              text="Eliminar"
              bordered
              onPress={() => { this.clickDelete(this.state.selectedFilter) }}
              key="button-2"
              textStyle={{
                fontSize: 18,
                color: '#F05576',
              }} />
          </DialogFooter>
        } >
        <DialogContent
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 20,
          }} >
          <Text>¿Eliminar las imágenes seleccionadas?</Text>
        </DialogContent>
      </Dialog>
    )
  }

  //////////////////////////////////////////////////////////////////////////////////////// ONCLICK UNA IMAGEN, SE SELECCIONA
  onClickImg = (id) => {
    this.setState(prevState => ({
      imgResults: prevState.imgResults.map((image, i) => (image.id === id
        ? { ...image, selected: !image.selected }
        : { ...image }))
    }));
  }

  //////////////////////////////////////////////////////////////////////////////////////// VIEW CON OPCIÓN DE ELIMINAR Y COMPARTIR. APARECE AL SELECCIONAR UNA IMAGEN
  showTools = () => {
    let counter = this.state.imgResults.filter(image => image.selected);
    if (counter.length > 0) {
      return <View style={styles.tools}>
        <View style={[styles.optionButtons, styles.pink]} >
          <Icon style={styles.icons}
            name="trash"
            onPress={() => {
              this.setState({ defaultAnimationDialog: true });
            }} 
            color="white" />
        </View>
      </View>
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////// ELIMINAR UNA IMAGEN. POR AHORA SIMULADO, SÓLO ELIMINA LA IMAGEN DE LA ARRAY DE IMÁGENES
  clickDelete = () => {
    let selected = this.state.imgResults.filter(image => image.selected);
    for (let i = 0; i < selected.length; i++) {
      var path = 'file://' + selected[i].src;
      RNFS.unlink(path)
        .then(() => {
          console.log('FILE DELETED');
          this.setState(prevState => ({
            savedData: prevState.savedData.filter((image => (image.path !== selected[i].src))),
            imgList: prevState.imgList.filter((image => (image !== selected[i].src))),
          }));
          this.saveList(this.state.savedData);
          this.setResults(this.state.selectedFilter);
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
    this.setState({ defaultAnimationDialog: false });
  }

  //////////////////////////////////////////////////////////////////////////////////////// RENDER DE CADA IMAGEN
  renderItemImg = ({ item }) => (
    <TouchableOpacity
      style={styles.image}
      onPress={() => this.onClickImg(item.id)} >
      <Image style={(item.selected ? styles.selectedImage : styles.img)} source={{ uri: `file://${item.src}` }} />
    </TouchableOpacity>
  )

  //////////////////////////////////////////////////////////////////////////////////////// RENDER DEL COMPONENTE
  render() {
    return (
      <View style={styles.container}>
        <ScrollView>
          <View style={[styles.listContainer, styles.folderContainer]} >
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
          {this.showResults()}
        </ScrollView>
        {this.showTools()}
      </View>
    );
  }
}