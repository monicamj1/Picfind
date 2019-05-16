import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, FlatList, Image, TouchableHighlight, Button, ScrollView, ToastAndroid } from 'react-native';
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
import Clarifai from 'clarifai';
import AsyncStorage from '@react-native-community/async-storage';
import GridList from 'react-native-grid-list';
import Icon from 'react-native-vector-icons/FontAwesome';
import Share from 'react-native-share';
import { produce } from 'immer';

const app = new Clarifai.App({
  apiKey: '73cdb62bd9594690acc4626aa080c1f0'
});




export default class Home extends Component {
  state = {
    filterList: [
      { id: 0, name: "Todas", results: 0, selected: true },
      { id: 1, name: "Caras", results: 0, selected: true },
      { id: 2, name: "Sin clasificar", results: 0, selected: true },
    ],
    folderName: null,
    selectedFolder: null,
    selectedFilter: null,
    showFilters: false,
    showPics: false,
    analysis: 0,
    process: null,
    imgList: [],
    imgResults: [],
    savedData: [],
    defaultAnimationDialog: false,
    visible: false,
  }



  ///////////////////////////////////////////////////////////////////////////////////////// BARRA DE NAVEGACIÓN SUPERIOR
  static navigationOptions = {
    title: 'Facefind',
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
          console.log(ficheros);
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

    this.loadListOnly();
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

    this.checkIfImgExist();
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
      console.log('Nuevas imágenes', newImg);
    } else {
      console.log('No hay imágenes nuevas a enviar');
      this.setState({
        analysis: 100,
      });
      this.loadListOnly();
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
    this.setState({ process: 0 });
    for (let i = 0; i < img.length; i++) {
      RNFS.readFile(img[i], 'base64').then(base64 => {
        app.models.predict(Clarifai.FACE_DETECT_MODEL, { base64 })
          .then(res => {
            if (res.outputs) {
              data.push({ 'path': img[i], 'clarifai': res.outputs });
              this.saveList(data);
              console.log('Clarifai resp', data);
              this.setState(prev => ({
                process: prev.process + 1,
              }));
              this.updateProcess(img);

            }
            else {
              console.log("No hay outputs para :", img[i]);
            }
          })
          //error de la API 
          .catch(error => {
            Alert.alert('error', JSON.stringify(error));
          })
      })
    }
  }



  //////////////////////////////////////////////////////////////////////////////////////// UPDATE DEL PORCENTAJE DE IMÁGENES PROCESADAS
  updateProcess = (img) => {
    let n = Math.floor(Number((100 * this.state.process) / (img.length)));
    this.setState({
      analysis: n,
    });
  }


  //////////////////////////////////////////////////////////////////////////////////////// PARA ACTUALIZAR THIS.STATE.SAVEDDATA
  async loadListOnly() {
    const data = await AsyncStorage.getItem('data');
    const json = await JSON.parse(data);
    if (data) {
      this.setState({ savedData: json });   
    } else {
      console.log('No hay datos');
    }
    this.countItems();
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
    <TouchableOpacity style={(item.selected ? styles.item : styles.itemSelected)}
      activeOpacity={0.2}
      onPress={this.changeSelected(item.id)}
    >
      <Image source={(item.selected ? require('./assets/icono_filtro.png') : require('./assets/icono_filtro_sel.png'))} style={styles.itemPic} />
      <Text style={(item.selected ? styles.itemName : styles.itemNameSelected)}>{item.name}</Text>

      <Text style={styles.filterProgress}>{item.results}</Text>
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



  

  //////////////////////////////////////////////////////////////////////////////////////// ONCLICK DEL BOTÓN DE MOSTRAR RESULTADOS
  clickBtn = () => {
    //console.log('Pulsar boton', this.state.filterList);
    this.setState({
      showPics: false,
      imgResults: [],
    })
    let filtro = this.state.filterList.filter(f => f.selected === false);
    let images = [];
    console.log('Filtro', filtro[0].id);
    switch (filtro[0].id) {
      case 0: //Todas
        this.state.imgList.forEach(img => {
          images.push({ 'id': img, 'src': img, 'selected': true });
        })
        break;
      case 1: //Caras
        this.state.imgList.forEach(img => {
          for (let j = 0; j < this.state.savedData.length; j++) {
            if (img === this.state.savedData[j].path) {
              if (this.state.savedData[j].clarifai[0].data.regions !== undefined) { //Si es cara  
                images.push({ 'id': img, 'src': img, 'selected': true });
              }
            }
          }
        })
        break;
      case 2: //El resto
        this.state.imgList.forEach(img => {
          for (let j = 0; j < this.state.savedData.length; j++) {
            if (img === this.state.savedData[j].path) {
              if (this.state.savedData[j].clarifai[0].data.regions === undefined) { //Si es no es nada  
                images.push({ 'id': img, 'src': img, 'selected': true });
              }
            }
          }
        })
        break;
    }

    console.log('Images', images);
    if(images.length > 0){
      this.setState({
        showPics: true,
        imgResults: images,
      })
    }
    else{
      ToastAndroid.show('No hay resultados para mostrar.', ToastAndroid.SHORT);
    }
    
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
        onPress={() => this.clickBtn(this.state.imgList)}
        color="#F05576"
        disabled={dis}
      />
    </View>
  }



  //////////////////////////////////////////////////////////////////////////////////////// RENDERIZAR COMPONENTE CON LOS RESULTADOS
  showResults = () => { 
    if (this.state.showPics == true) {
      return (
        <View style={styles.rcontainer}>
          <View style={styles.rtitle}>
            <Text style={styles.rtitleText}>RESULTADOS</Text>
          </View>
          <GridList data={this.state.imgResults}
            numColumns={4}
            renderItem={this.renderItem}
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
              }}
            />
            <DialogButton
              text="Eliminar"
              bordered
              onPress={() => { this.clickDelete() }}
              key="button-2"
              textStyle={{
                fontSize: 18,
                color: '#F05576',
              }}
            />
          </DialogFooter>
        }
      >
        <DialogContent
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 20,
          }}
        >
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


  ///////////////////////////////////////////////////////////////////////////////////////// ELIMINAR UNA IMAGEN. POR AHORA SIMULADO, SÓLO ELIMINA LA IMAGEN DE LA ARRAY DE IMÁGENES
  clickDelete = () => {
    let selected = this.state.imgResults.filter(image => image.selected == false);

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
         this.clickBtn();
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
    
    //close dialog
    this.setState({ defaultAnimationDialog: false });
  }


  //////////////////////////////////////////////////////////////////////////////////////// ABRIR OPCIONES DE COMPARTIR
  clickShare = () => {
    Share.open(options)
      .then((res) => { console.log(res) })
      .catch((err) => { err && console.log(err); });
  }



  //////////////////////////////////////////////////////////////////////////////////////// SE CANCELA ELIMINAR IMAGEN
  onCancel() {
    console.log("CANCEL")
    this.setState({ visible: false });
  }



  //////////////////////////////////////////////////////////////////////////////////////// COMPARTIR IMAGEN
  onOpen = () => {
    let selected = this.state.imgResults.filter(image => image.selected == false);
    for (let i = 0; i < selected.length; i++) {
      let shareImageBase64 = {
        url: 'file://'+selected[i].src,
      };
      console.log(shareImageBase64);
      Share.open(shareImageBase64);

    }
  }


  //////////////////////////////////////////////////////////////////////////////////////// VIEW CON OPCIÓN DE ELIMINAR Y COMPARTIR. APARECE AL SELECCIONAR UNA IMAGEN
  showTools = () => {
    let counter = this.state.imgResults.filter(image => image.selected == false);
    if (counter.length > 0) {
      return <View style={styles.tools}>
        <View style={[styles.optionButtons, styles.pink]} >
          <Icon style={styles.icons}
            name="trash"
            onPress={this.openPopUp}
            color="white"
          />
        </View>
        <View style={[styles.optionButtons, styles.yellow]}>
          <Icon style={styles.icons}
            name="share-alt"
            onPress={this.onOpen}
            color="white"
          />
        </View>
      </View>
    }
  }


  //////////////////////////////////////////////////////////////////////////////////////// ABRIR DIALOG DE CONFIRMAR ELIMINACIÓN
  openPopUp = () => {
    this.setState({
      defaultAnimationDialog: true,
    });
  }


  //////////////////////////////////////////////////////////////////////////////////////// RENDER DE CADA IMAGEN
  renderItem = ({ item }) => (
    (!item.selected ?
      <TouchableOpacity
        style={styles.image}
        onPress={() => this.onClickImg(item.id)} >
        <Image style={styles.selectedImage} source={{ uri: `file://${item.src}` }} />
      </TouchableOpacity>
      :
      <TouchableOpacity
        style={styles.image}
        onPress={() => this.onClickImg(item.id)}  >
        <Image style={styles.img} source={{ uri: `file://${item.src}` }} />
      </TouchableOpacity>
    )
  )



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
        {this.showTools()}
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
  searchBtn: {
    marginTop: 40,
    marginLeft: '15%',
    marginRight: '15%',
    marginBottom: 40,
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
    width: '100%',
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
    backgroundColor: '#b2b2b299',
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
