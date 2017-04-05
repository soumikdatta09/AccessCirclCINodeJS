module.exports = {

  CircleCISettings: {    
    ApiUrl: "circleci.com",
    path: "api/v1.1/project",
    ApiToken: "3dec43cf8433618284f3642d37a19be5e0b2ab0e",
    TestProject: "tests?circle-token="
  },

  jwtSettings: {
    jwtUrl: "heartbeat2-staging-api.herokuapp.com",
    path: "login",
    studioMailID: "studio_india@example.com",
    studioPassword: "password"
  },
  TokenSettings: {
    TokenGetUrl: "heartbeat2-staging-api.herokuapp.com",
    path: "gitHubRepositories",
    HeaderContentName: "Authorization"
  },
  CircleCISnapshotSettings: {
    CircleCISnapShotName: "circle_ci_snapshot",
    total_test_count: "total_test_count",
    test_success_rate: "test_success_rate",
    PostURLBaseAddress: "heartbeat2-staging-api.herokuapp.com",
    PostQueryCircleCIPath: "git_hub_repositories",
    PostKeyWord: "circle_ci_snapshots",
    HeaderContentName: "Authorization"
  }

};