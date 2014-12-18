(function ($) {
    var settingsComentarios = "";
    var nomUsuarios = [];
    var formatoComentario = {
        uniqueId: "",
        campoPertenece: "",
        idUsuario: "",
        resuelto: false,
        comentario: "",
        hijos: [],
        padre: "",
        tieneHijosNoResueltos: function () {//returns true if any child is not resolved
            var flag = false;
            $(this.hijos).each(function (key, element) {
                if (!element.resuelto) {
                    flag = true;
                    return;
                }
            });
            return flag;
        },
        resolverComentario: function () {Cascading solves comments
            if (this.hijos.length) {
                if (!this.tieneHijosNoResueltos()) {
                    this.resuelto = true;
                    if (this.padre !== "") {
                        var p = obtenerPadre(this.padre);
                        p.resolverComentario();
                    }
                }
            } else {
                this.resuelto = true;
                if (this.padre !== "") {
                    var p = obtenerPadre(this.padre);
                    p.resolverComentario();
                }
            }
        }
    };
    $.fn.comentarios = function (options) {
        this.each(function (key, elementComment) {
            if ($(elementComment).attr('tag-comment') === undefined) {
                alert('Error cargando libreria de comentarios, no todos los elementos tiene tag-comment');
                return;
            }else{
                $(elementComment).empty();
            }

            // This is the easiest way to have default options.
            settingsComentarios = $.extend({
                // These are the defaults.
                url: "#",
                mostrarTodo: false,
                crearComentario: true,
                idReferencia: -1, //ID registration,
                idUsuario: -1,
                data: [],
                extraBusqueda: {}
            }, options);
            agregarModal();
            obtenerComentarios();
            if (settingsComentarios.crearComentario) {
            } else {
                $('#informacionModal').html("No tiene permisos");
            }
            var verComentarios = $("<span>");
            verComentarios.addClass('glyphicon glyphicon-comment newComentario btn btn-sm btn-default');
            verComentarios.attr('data-toggle', 'modal');
            verComentarios.attr('data-target', '#nuevoComentario');
            verComentarios.click(function () {
                inicialComentario(elementComment);
            });
            verComentarios.html(' ');
            $(elementComment).append(verComentarios);
        });
        resaltarPendientesCampos();
    };

    var resaltarPendientesCampos = function () {
        $('[tag-comment]').each(function (key, e) {
            var element = $(e).find(".glyphicon-comment");
            var contador = 0;
            if (settingsComentarios.data.length) {
                $(settingsComentarios.data).each(function (key, jsn) {
                    if (jsn.campoPertenece === $(e).attr('tag-comment')) {
                        if (!jsn.resuelto) {
                            contador++;
                        }
                    }
                });
                if (contador > 0) {
                    $(element).addClass('btn-danger');
                } else {
                    $(element).removeClass('btn-danger');
                }
            }
        });
    };
    // Processes comments first level
    var inicialComentario = function (elementComment) {
        limpiarPopup();
        if (settingsComentarios.data.length) {
            var todo = $('<div>');
            var numerador = 1;
            $(settingsComentarios.data).each(function (key, e) {
                if (e.campoPertenece === $(elementComment).attr('tag-comment')) {
                    if ((settingsComentarios.mostrarTodo) || (e.idUsuario === settingsComentarios.idUsuario)) {
                        var cont = $("<div>");
                        var btnAcE = $("<div>");
                        var btnComment = $("<div>");
//                        cont.attr("style", "min-height:41px");
                        cont.addClass("row");
                        cont.append('<div class="col-xs-7 col-lg-9 text-justify"><span class="badge">' + numerador + "</span> " + e.comentario + '</div>');
                        numerador++;
                        cont.append('<div class="col-xs-5 col-lg-3 text-right">' + ((e.resuelto) ? '<span class="label label-success">Resuelto</span>' : ((e.hijos.length) ? '<span class="label label-info">Observado</sán>' : '<span class="label label-warning">Pentiente</span>')) + '</div>');
                        btnComment.addClass('col-xs-6 col-lg-6 text-center');
                        btnComment.click(function () {
                            internaComentarios(e, key);
                        });
                        btnComment.append(((e.resuelto) ? ((e.hijos.length)?'<br/><button class="btn btn-xs btn-block btn-default"><span class="glyphicon glyphicon-zoom-in"></span> Ver Comentarios</button>':'') : '<br/><button class="btn btn-xs btn-block btn-default"><span class="glyphicon glyphicon-comment"></span> Comentar</button>'));
                        cont.append(btnComment);
                        if (settingsComentarios.idUsuario === e.idUsuario && (e.hijos.length === 0)) {
                            btnAcE.addClass('col-xs-6 col-lg-6 text-center');
                            btnAcE.click(function () {
                                actualizarEstado(e);
                            });
                            btnAcE.append(((e.resuelto) ? '' : '<br/><button class="btn btn-xs btn-block btn-default"><span class="glyphicon glyphicon-ok"></span> Aprobar</button>'));
                            cont.append(btnAcE);
                        }
                        todo.append(cont);
                        todo.append('<br/><div class="text-muted text-left"><em><strong>Autor:</strong> ' + getNombreUsuario(e.idUsuario) + '</em></div>');
                        todo.append("<hr/>");
                    }
                }
            });
            $('#informacionModal').append(todo);
        } else {
            $('#informacionModal').html('<span>No hay comentarios sobre este campo</span><hr>');
        }
        if (settingsComentarios.crearComentario) {
            var formNuevoComentario = $("<div>");
            var input = $('<input>');
            var btnGuardar = $('<button>');
            input.addClass('form-control');
            input.attr('id', "ingComent");
            input.attr('maxlength', "250");
            btnGuardar.addClass("btn btn-primary btn-sdis addBtn");
            btnGuardar.attr('id', "guardarComentario");
            btnGuardar.attr('tag', $(elementComment).attr('tag-comment'));
            btnGuardar.html('Guardar Comentario');
            btnGuardar.click(function () {
                guardarComentario(elementComment);
            });
            formNuevoComentario.append($('<label>').html('Ingrese su comentario sobre ' + $(elementComment).attr('tag-comment') + ':'));
            formNuevoComentario.append(input);
            $('#informacionModal').append(formNuevoComentario);
            $('#botoneraComentario').append(btnGuardar);
        }
    };
    // Children Processes comments
    var internaComentarios = function (padre, pos, Fvolver) {
        var abuelo = {};
        if (padre.padre !== "") {
            abuelo = obtenerPadre(padre.padre);
            if (abuelo.padre !== "" && Fvolver) {
                internaComentarios(abuelo, abuelo.hijos.indexOf(padre));
                return;
            }
        }
        limpiarPopup();
        var todo = $('<div>');
        var contVolver = $('<div>');
        contVolver.addClass('col-lg-12');
        var volver = $('<div>');
        volver.addClass('btn btn-sm btn-default');
        volver.html('<span class="glyphicon glyphicon-arrow-left"></span> Atrás');
        volver.click(function () {
            if (padre.padre !== "") {
                internaComentarios(abuelo, abuelo.hijos.indexOf(padre), true);
            } else {
                inicialComentario($('[tag-comment=' + padre.campoPertenece + ']'));
            }
        });
        contVolver.append(volver);
        var espacioPadre = $("<div class=' well well-sm text-center'>");
        espacioPadre.addClass('row');

        espacioPadre.append(contVolver);
        var numPadre = 0;
        if (padre.padre === "") {
            numPadre = (settingsComentarios.data.indexOf(padre) + 1);
        } else {
            numPadre = (obtenerPadre(padre.padre).hijos.indexOf(padre) + 1);
        }
        espacioPadre.append('<div class="col-xs-7 col-lg-9 text-justify"><br/> <span class="badge" >' + numPadre + '</span> ' + padre.comentario + '</div>');
        espacioPadre.append('<div class="col-xs-5 col-lg-3 text-right"><br/>' + ((padre.resuelto) ? '<span class="label label-success">Resuelto</span>' : ((padre.hijos.length) ? '<span class="label label-info">Observado</sán>' : '<span class="label label-warning">Pentiente</span>')) + '</div>');
        todo.append(espacioPadre);
        var formNuevoComentario = $("<div>");
        if (!padre.resuelto) {
            formNuevoComentario = $("<div class=' well well-sm text-center'>");
            var input = $('<textarea>');
            var btnGuardar = $('<button>');
            input.addClass('form-control');
            input.attr('id', "ingComent");
            input.attr('maxlength', "250");
            btnGuardar.addClass("btn btn-default btn-sm btn-sdis addBtn");
            btnGuardar.html('<span class="glyphicon glyphicon-floppy-saved"></span> Guardar Comentario');
            btnGuardar.click(function () {
                guardarReplica(padre, pos);
            });
            formNuevoComentario.append($('<label>').html('<hr/>Ingrese su comentario :'));
            formNuevoComentario.append(input);
            formNuevoComentario.append("<br/>");
            formNuevoComentario.append(btnGuardar);

        }

        if (padre.hijos.length) {
            $(padre.hijos).each(function (key, e) {
                var cont = $("<div>");
                var btnAcE = $("<div>");
                var btnComment = $("<div>");
                cont.addClass("row");
                cont.append('<div class="col-xs-7 col-lg-9 text-justify"><span class="badge" >' + (obtenerPadre(e.padre).hijos.indexOf(e) + 1) + "</span> " + e.comentario + '</div>');
                cont.append('<div class="col-xs-5 col-lg-3 text-right">' + ((e.resuelto) ? '<span class="label label-success">Resuelto</span>' : ((e.hijos.length) ? '<span class="label label-info">Observado</sán>' : '<span class="label label-warning">Pentiente</span>')) + '</div>');
                btnComment.addClass('col-xs-6 col-lg-6 text-center');


                btnComment.click(function () {
                    internaComentarios(e, key);
                });
                btnComment.append(((e.resuelto) ? ((e.hijos.length)?'<br/><button class="btn btn-xs btn-block btn-default"><span class="glyphicon glyphicon-zoom-in"></span> Ver Comentarios</button>':'') : '<br/><button class="btn btn-xs btn-block btn-default"><span class="glyphicon glyphicon-comment"></span> Comentar</button>'));
                cont.append(btnComment);
                if (settingsComentarios.idUsuario === e.idUsuario && (e.hijos.length === 0)) {
                    btnAcE.addClass('col-xs-6 col-lg-6 text-center');
                    btnAcE.click(function () {
                        actualizarEstado(e, padre, pos);
                    });
                    btnAcE.append(((e.resuelto) ? '' : '<br/><button class="btn btn-xs btn-block btn-default"><span class="glyphicon glyphicon-ok"></span> Aprobar</button>'));
                    cont.append(btnAcE);
                }
                todo.append(cont);
                todo.append('<br/><div class="text-muted text-left"><em><strong>Autor:</strong> ' + getNombreUsuario(e.idUsuario) + '</em></div>');
                todo.append("<hr/>");
//                }
            });
            $('#informacionModal').append(todo);
        } else {

        }
        todo.append(formNuevoComentario);
        $('#informacionModal').append(todo);
    };

    // Save Children
    var guardarReplica = function (padre, pos) {
        console.log(padre, pos,"replica");
        var comment = {};
        var ruta = "";
        $.extend(comment, formatoComentario);
        $.extend(comment, {
            campoPertenece: padre.campoPertenece,
            idUsuario: settingsComentarios.idUsuario,
            comentario: $('#ingComent').val(),
            padre: ruta.replace(/^,+/, ''),
            uniqueId: generateUid(),
            hijos: []
        });
        ruta = padre.padre + "," + padre.uniqueId;
        comment.padre = ruta.replace(/^,+/, '');
        padre.hijos.push(comment);
        guardarComentarios();
        internaComentarios(padre, pos);
    };
    // Get Father
    var obtenerPadre = function (str) {
        var posPadre = str.split(",");
        var primera = true;
        var inicio = settingsComentarios.data;
        $(posPadre).each(function (key, e) {
            if (primera) {
                $(inicio).each(function (key2, e2) {
                    if (e2.uniqueId === e) {
                        inicio = e2;
                    }
                });
                primera = false;
            } else {
                $(inicio.hijos).each(function (key2, e2) {
                    if (e2.uniqueId === e) {
                        inicio = e2;
                    }
                });
            }
        });
        return inicio;
    };
    // Update state comment
    var actualizarEstado = function (ele, padre, pos) {
        if (ele !== undefined) {
            ele.resolverComentario();
            guardarComentarios();
            if (padre !== undefined) {
                internaComentarios(padre, pos);
            } else {
                inicialComentario($('[tag-comment=' + ele.campoPertenece + ']'));
            }
        }
    };
    //Get Comments
    var obtenerComentarios = function () {
        $.extend(settingsComentarios.extraBusqueda, {
            id: settingsComentarios.idReferencia
        });
        $.ajax({
            url: settingsComentarios.url + 'getComentarios',
            type: 'POST',
            data: settingsComentarios.extraBusqueda,
            success: function (data) {
                if (data) {
                    settingsComentarios.data = data;
                    agregarMetodos(settingsComentarios.data);
                    resaltarPendientesCampos();
                } else {
                    settingsComentarios.data = [];
                }
            },
            error: function () {
                alert('Error al cargar los comentarios');
            }
        });
    };
    // Clear Popup
    var limpiarPopup = function () {
        $('.addBtn').remove();
        $('#informacionModal').html('');
    };
    //New Comment
    var nuevoComentario = function (_this) {
        var nuevoComentario = $("<span>");
        nuevoComentario.addClass('glyphicon glyphicon-plus newComentario btn btn-sm btn-primary');
        nuevoComentario.attr('data-toggle', 'modal');
        nuevoComentario.attr('data-target', '#nuevoComentario');
        nuevoComentario.click(function () {
            limpiarPopup();
            var formNuevoComentario = $("<div>");
            var input = $('<input>');
            var btnGuardar = $('<button>');
            input.addClass('form-control');
            input.attr('id', "ingComent");
            input.attr('maxlength', "250");
            btnGuardar.addClass("btn btn-primary btn-sdis addBtn");
            btnGuardar.attr('id', "guardarComentario");
            btnGuardar.attr('tag', $(_this).attr('tag-comment'));
            btnGuardar.html('Guardar Comentario');
            btnGuardar.click(guardarComentario);
            formNuevoComentario.append($('<label>').html('Ingrese su comentario sobre ' + $(_this).attr('tag-comment') + ':'));
            formNuevoComentario.append(input);
            $('#informacionModal').html(formNuevoComentario);
            $('#botoneraComentario').append(btnGuardar);
        });
        $(_this).append(nuevoComentario);
    };

    var guardarComentario = function (e) {
        var comment = {};
        $.extend(comment, formatoComentario);
        $.extend(comment, {
            campoPertenece: $(e).attr('tag-comment'),
            idUsuario: settingsComentarios.idUsuario,
            comentario: $('#ingComent').val(),
            uniqueId: "" + generateUid(),
            hijos: []
        });
        settingsComentarios.data.push(comment);
        guardarComentarios();
        inicialComentario(e);
    };

    var limpiarGuardado = function (inicio) {
        var arreglado = [];
        $(inicio).each(function (key, elementComment) {
            var element = {};
            $.extend(element, elementComment);
            $.extend(element, {
                tieneHijosNoResueltos: null,
                resolverComentario: null
            });
            if (element.hijos.length) {
                element.hijos = limpiarGuardado(elementComment.hijos);
            }
            arreglado.push(element);
        });
        return arreglado;
    };

    var agregarMetodos = function (inicio) {
        var arreglado = [];
        $(inicio).each(function (key, elementComment) {
            var element = {};
            elementComment.resuelto = (elementComment.resuelto == "true");
            elementComment.idUsuario = parseInt(elementComment.idUsuario);
            $.extend(elementComment, {
                tieneHijosNoResueltos: formatoComentario.tieneHijosNoResueltos,
                resolverComentario: formatoComentario.resolverComentario
            });
            (elementComment.padre==0)?elementComment.padre="":"";
            if (elementComment.hijos) {
                if (elementComment.hijos.length) {
                    elementComment.hijos = agregarMetodos(elementComment.hijos);
                }
            } else {
                elementComment.hijos = [];
            }
            arreglado.push(element);
        });
        return inicio;
    };
    var getNombreUsuario = function (id) {
        var retorno = "";
        if (nomUsuarios[id]) {
            return nomUsuarios[id];
        } else {
            $.ajax({
                url: settingsComentarios.url + 'getNombreUsuario',
                type: 'POST',
                async: false,
                data: {
                    'id': id
                },
                success: function (data) {
                    if (data.status) {
                        nomUsuarios[id] = data.nombre;
                        retorno = data.nombre;
                    }
                },
                error: function () {
                    alert('Error obteniendo nombre');
                }, complete: function (jqXHR, textStatus) {
                }
            });
            return retorno;
        }
    };
    var guardarComentarios = function () {
        resaltarPendientesCampos();
        var json = JSON.parse(JSON.stringify(settingsComentarios.data));
        limpiarGuardado(json);
        $.ajax({
            url: settingsComentarios.url + 'setComentario',
            type: 'POST',
            data: {
                'extras': settingsComentarios.extraBusqueda,
                'comentarios': json
            },
            success: function (data) {
            },
            error: function () {
                alert('Error al guardar comentarios');
            }, complete: function (jqXHR, textStatus) {
            }
        });
        return true;
    };
    var agregarModal = function () {
        if (!$('#nuevoComentario').length) {
            $('body').append('<div class="modal fade" id="nuevoComentario" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
                    '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                    '<div class="modal-header">' +
                    '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>' +
                    '<h4 class="modal-title" id="myModalLabel">Comentario</h4>' +
                    '</div>' +
                    '<div class="modal-body" id="informacionModal">' +
                    'Cargando...' +
                    '</div>' +
                    '<div class="modal-footer" id="botoneraComentario">' +
                    '<button type="button" class="btn btn-default" data-dismiss="modal">Cerrar</button>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +
                    '</div>');
        }
    };
    var generateUid = function (separator) {
        var delim = separator || "-";
 
        function S4() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }

        return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
    };
}(jQuery));