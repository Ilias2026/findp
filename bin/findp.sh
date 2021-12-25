if ! [ -x "$(command -v node)" ]
then
    echo 'node.js needs to be installed'
    exit
fi
node "$(dirname $(which findp))/find_script/find.js" "$@"