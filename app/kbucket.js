exports.KBucketServer = KBucketServer;

const fs = require('fs');
KBUCKET_SRC = __dirname + '/../kbucket/src/kbucket'

const HemlockNode = require(KBUCKET_SRC + '/../hemlock/hemlocknode.js').HemlockNode;
const KBHttpServer=require(KBUCKET_SRC+'/kbhttpserver.js').KBHttpServer;
const KBNodeApi=require(KBUCKET_SRC+'/kbnodeapi.js').KBNodeApi;
const KBNodeShareIndexer = require(KBUCKET_SRC + '/kbnodeshareindexer.js').KBNodeShareIndexer;

//var CLP = new CLParams(process.argv);
function KBucketServer(share_directory=__dirname+'/public/data',init_opts={}) {
  this.app = function get_app() {
    return server
  }
  
  share_directory = require('path').resolve(share_directory);
  if (!fs.existsSync(share_directory)) {
    console.error('Directory does not exist: ' + share_directory);
    process.exit(-1);
  }
  if (!fs.statSync(share_directory).isDirectory()) {
    console.error('Not a directory: ' + share_directory);
    process.exit(-1);
  }

  var init_opts = {};
  init_opts.auto_use_defaults = true;
  init_opts.config_directory_name='.kbucket';
  init_opts.config_file_name='kbnode.json';
  init_opts.node_type_label='share';
  init_opts.network_type='kbucket';

  var X = new HemlockNode(share_directory, 'leaf');
  let context=X.context();
  let API=new KBNodeApi(context);
  let SS=new KBHttpServer(API);
  var server = SS.app()
  X.setHttpServer(server);
  let TM=new LeafManager();
  X.setLeafManager(TM);
  X.initialize(init_opts, function(err) {
    if (err) {
      console.error(err);
      process.exit(-1);
    }  
    context.share_indexer=new KBNodeShareIndexer(context.config);
    context.share_indexer.startIndexing();
  });
  function LeafManager() {
    this.nodeDataForParent = function() {
      return context.share_indexer.nodeDataForParent();
    };
    this.restart=function() {
      console.info('Restarting indexing.');
      if (context.share_indexer) {
        context.share_indexer.restartIndexing();
      }
    };
  }

}


