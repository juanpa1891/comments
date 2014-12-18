Plugin comments 


Requirements:

- Jquery
- Bootstrap 3

Implementation

HTML

<div class="comment" tag-comment="first_comment"></div> 


JS

$('.comment').comentarios({
      url: 'http://mysite.com/services',
      crearComentario: true,
      mostrarTodo: true,
      idReferencia: 10,
      idUsuario: 20,//Cod user (Optional)
      extraBusqueda: { (Optional more search parameters)
          section: 1,
          type: 10
      }
  }); 
