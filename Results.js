import React, { Component } from 'react';
import { Alert, Platform, StyleSheet, Text, View, Image, TouchableOpacity, FlatList, Dimensions, ScrollView, Button } from 'react-native';
import PhotoGrid from 'react-native-image-grid';
import GridList from 'react-native-grid-list';
import Icon from 'react-native-vector-icons/FontAwesome';
import Dialog, {
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogButton,
  SlideAnimation,
  ScaleAnimation,
} from 'react-native-popup-dialog';
import Share from 'react-native-share';
//import Clarifai from 'clarifai';

var RNFS = require('react-native-fs');

let nombreFiltro = 'Filter';

/*
const app = new Clarifai.App({
  apiKey: '73cdb62bd9594690acc4626aa080c1f0'
});*/

//libreria para poder pasar las imagenes en base64. 
//import ImgToBase64 from 'react-native-image-base64';

const filters = [
  { id: 0, name: "Caras", selected: true },
  { id: 1, name: "Borrosas", selected: true },
]



export default class Results extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: props.navigation.getParam('filter', -1),
      folder: props.navigation.getParam('folder', -1),
      imgList: [
        { id: 0, src: require('./ReactImg/user.png'), selected: true },
      ],
      defaultAnimationDialog: false,
      visible: false,
      img1: './ReactImg/user.png',
    }
  }

  componentDidMount = () => {

    //TODO: Switch con el id de filtro que llega i el id del modelo a analizar. 

    //Aqui se intenta coger una imagen guardada en el dispositivo y pasarla a base64
    //realmente no se consigue porque la libreria espera la imagen usando el FS 
    /* let img = this.state.img1
     ImgToBase64.getBase64String(img)
       .then(base64String => {
         Alert.alert("img");
 
         //Para el caso de las caras
         app.models.predict(Clarifai.a403429f2ddf4b49b307e318f00e528b, { base64: base64String })
           .then(res => {
             Alert.alert('success', JSON.stringify(res.data.concepts));
             if(res.data.concepts){
               //TODO: hacer push de la imagen en imgList
             }
             else{
               //la imagen no se añade
             }
           })
           //error de la API 
           .catch(error => {
             Alert.alert('error', JSON.stringify(error));
           })
       })
       //error de pasar a base64
       .catch(err => {
         Alert.alert('error', JSON.stringify(err));
       });
 */


    //Para el prototipo:
    switch (this.state.filter) {
      case 0:
        this.setState({
          imgList: [
            { id: 0, src: require('./ReactImg/user.png'), selected: true },
            { id: 1, src: require('./ReactImg/user00.jpg'), selected: true },
            { id: 2, src: require('./ReactImg/user01.jpg'), selected: true },
            { id: 3, src: require('./ReactImg/user02.jpg'), selected: true },
            { id: 4, src: require('./ReactImg/user03.jpg'), selected: true },

          ]
        })
        break;
        case 1:
        this.setState({
          imgList: [
            { id: 0, src: require('./ReactImg/borrosa00.jpg'), selected: true },
          ]
        })
        break;
    }
  }



  static navigationOptions = {
    title: `${nombreFiltro}`,
    headerTitleStyle: {
      flex: 1,
    },
    headerTintColor: 'white',
    headerStyle: {
      backgroundColor: '#45D9B4',
    },
  }


  //ONCLICK UNA IMAGEN, SE SELECCIONA
  onClickImg = (id) => {
    this.setState(prevState => ({
      imgList: prevState.imgList.map((image, i) => (image.id === id
        ? { ...image, selected: !image.selected }
        : { ...image }))
    }));


  }

  //ELIMINAR UNA IMAGEN. POR AHORA SIMULADO, SÓLO ELIMINA LA IMAGEN DE LA ARRAY DE IMÁGENES
  clickDelete = () => {
    let selected = this.state.imgList.filter(image => image.selected == true);
    this.setState({
      imgList: selected
    })


    //TODO: Conseguir el path de la imagen en base64 para hacer el unlink y eliminar la imagen
    var path = '';

    RNFS.unlink(path)
      .then(() => {
        console.log('FILE DELETED');
      })
      .catch((err) => {
        console.log(err.message);
      });

    //close dialog
    this.setState({ defaultAnimationDialog: false });
  }

  //ABRIR OPCIONES DE COMPARTIR
  clickShare = () => {
    Share.open(options)
      .then((res) => { console.log(res) })
      .catch((err) => { err && console.log(err); });
  }


  //SE CANCELA ELIMINAR IMAGEN
  onCancel() {
    console.log("CANCEL")
    this.setState({ visible: false });
  }

  //COMPARTIR IMAGEN
  onOpen = () => {
    //TODO: insertar en "url" la imagen eb base64 para compartir
    let shareImageBase64 = {
      title: "React Native",
      // message: "Hola mundo",
      url: 'www.google.com',
      // subject: "Share Link" //  for email
    };
    Share.open(shareImageBase64);
  }


  //VIEW CON OPCIÓN DE ELIMINAR Y COMPARTIR. APARECE AL SELECCIONAR UNA IMAGEN
  showTools = () => {
    let counter = this.state.imgList.filter(image => image.selected == false);
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


  //ABRIR DIALOG DE CONFIRMAR ELIMINACIÓN
  openPopUp = () => {
    this.setState({
      defaultAnimationDialog: true,
    });
  }



  //RENDER DE CADA IMAGEN
  renderItem = ({ item }) => (
    (!item.selected ?
      <TouchableOpacity
        style={styles.item}
        onPress={() => this.onClickImg(item.id)}
      >
        <Image style={styles.selected} source={item.src} />
      </TouchableOpacity>
      :
      <TouchableOpacity
        style={styles.item}
        onPress={() => this.onClickImg(item.id)}

      >
        <Image style={styles.img} source={item.src} />
      </TouchableOpacity>
    )
  ) //TODO: Arreglar el problema de los espacios entre imágenes



  render() {
    //TODO: Un if en el que, si la array de imágenes está vacía, en lugar de imprimir el GridList imprima un View que diga "Sin resultados"
    return (
      <View style={styles.container}>
        <GridList data={this.state.imgList}
          numColumns={4}
          renderItem={this.renderItem}
          keyExtractor={(item) => String(item.id.toString())} />
        {this.showTools()}

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
  item: {
    margin: 1,
  },
  img: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
  },
  selected: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
    opacity: 0.6,
  },
  checkmark: {
    width: '2%',
    height: '2%'
  },
  blank: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
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
